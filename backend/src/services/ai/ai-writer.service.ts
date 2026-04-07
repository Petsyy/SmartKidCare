import { buildConversationClosureReply } from "./chat-reply.service";
import { buildFacts } from "./ai-writer-helpers/facts.builders";
import {
  buildDeterministicNarrative,
  buildDeterministicNarrativeForFacts,
  buildEvaluationArtifacts,
  buildEvaluationArtifactsForFacts,
} from "./ai-writer-helpers/writer.narrative";
import {
  buildWriterDisplayPolicy,
  WriterDisplayPolicy,
} from "./ai-writer-helpers/writer.policy";
import {
  getConversationHistory,
  getHistory,
  hasRecentAssistantFollowUp,
  remember,
} from "./ai-writer-helpers/writer.memory";
import {
  tryWriteConversationClosureWithLLM,
  tryWriteStructuredNarrativeWithLLM,
} from "./ai-writer-helpers/writer.llm";
import {
  AIRole,
  WriterFacts,
  WriterSupportedResult,
} from "./ai-writer-helpers/types";
import { AIResponseLanguage } from "./language.service";

export type {
  AttendanceComparisonResult,
  ClassReportResult,
  FeedingComparisonResult,
} from "./ai-writer-helpers/types";

export {
  buildDeterministicNarrativeForFacts,
  buildEvaluationArtifactsForFacts,
  getConversationHistory,
};

const WRITER_MODE = (process.env.AI_WRITER_MODE ?? "").toLowerCase();
const USE_LLM_WRITER = WRITER_MODE === "llm";

function ragasCategoryFromScenario(scenario: WriterFacts["scenario"]): string {
  if (scenario === "child_feeding" || scenario === "class_feeding") {
    return "feeding_status";
  }
  if (
    scenario === "child_trend" ||
    scenario === "child_attendance_comparison" ||
    scenario === "child_feeding_comparison"
  ) {
    return "trend_analysis";
  }
  if (scenario === "child_report" || scenario === "class_report") {
    return "risk_analysis";
  }
  return "attendance_status";
}

function normalizeRole(role: string): AIRole {
  return "parent";
}

function buildLoggingContext(
  facts: WriterFacts,
  result: WriterSupportedResult,
): {
  childName?: string;
  attendance?: string;
  feedingCompletion?: string;
  date?: string;
  verified?: boolean;
} {
  if ("childName" in result && result.childName) {
    const attendance =
      "attendanceRate" in result
        ? `${result.attendanceRate}%`
        : facts.metricLines
            .find((line) => line.includes("Attendance"))
            ?.split(":")[1]
            ?.trim() || "Not recorded";
    const feedingCompletion =
      "feedingRate" in result
        ? `${result.feedingRate}%`
        : facts.metricLines
            .find((line) => line.includes("Feeding"))
            ?.split(":")[1]
            ?.trim() || "Not recorded";

    return {
      childName: result.childName,
      attendance,
      feedingCompletion,
      date: facts.timeframe,
      verified: true,
    };
  }

  if (facts.scenario.includes("class")) {
    return {
      childName: `Class summary (${facts.scenario})`,
      attendance: facts.metricLines
        .find((line) => line.includes("Attendance"))
        ?.split(":")[1]
        ?.trim(),
      feedingCompletion: facts.metricLines
        .find((line) => line.includes("Feeding"))
        ?.split(":")[1]
        ?.trim(),
      date: facts.timeframe,
      verified: true,
    };
  }

  return {
    childName: facts.childName || "Unknown",
    attendance:
      facts.metricLines
        .find((line) => line.includes("Attendance"))
        ?.split(":")[1]
        ?.trim() || "Not recorded",
    feedingCompletion:
      facts.metricLines
        .find((line) => line.includes("Feeding"))
        ?.split(":")[1]
        ?.trim() || "Not recorded",
    date: facts.timeframe,
    verified: true,
  };
}

export async function writeToolNarrative(params: {
  result: WriterSupportedResult;
  role: string;
  question: string;
  language: AIResponseLanguage;
  conversationId: string;
  suppressFollowUp?: boolean;
}): Promise<string> {
  const role = normalizeRole(params.role);
  const facts = await buildFacts({
    result: params.result,
    role,
    language: params.language,
  });

  const history = getHistory(params.conversationId);
  const displayPolicy: WriterDisplayPolicy = buildWriterDisplayPolicy({
    question: params.question,
    facts,
    suppressFollowUp: params.suppressFollowUp,
    hasRecentFollowUp: hasRecentAssistantFollowUp(history),
  });

  const deterministicReply = buildDeterministicNarrative(
    params.question,
    facts,
    displayPolicy,
  );
  const llmReply =
    USE_LLM_WRITER && displayPolicy.mode === "structured"
      ? await tryWriteStructuredNarrativeWithLLM({
          facts,
          role,
          language: params.language,
          question: params.question,
          history,
          policy: displayPolicy,
        })
      : null;
  const finalReply = llmReply ?? deterministicReply;

  const loggingContext = buildLoggingContext(facts, params.result);
  const evaluationArtifacts = buildEvaluationArtifacts({
    answer: finalReply,
    facts,
    policy: displayPolicy,
  });

  remember(params.conversationId, { role: "user", content: params.question });
  remember(params.conversationId, { role: "assistant", content: finalReply });
  return finalReply;
}

export async function writeConversationClosure(params: {
  role: string;
  language: AIResponseLanguage;
  message: string;
  conversationId: string;
}): Promise<string> {
  const role = normalizeRole(params.role);
  const history = getHistory(params.conversationId);
  let reply = await tryWriteConversationClosureWithLLM({
    role,
    language: params.language,
    message: params.message,
    history,
  });

  if (!reply) {
    reply = buildConversationClosureReply(role, params.language);
  }

  remember(params.conversationId, { role: "user", content: params.message });
  remember(params.conversationId, { role: "assistant", content: reply });
  return reply;
}

export function buildConversationId(params: {
  requesterId?: string;
  role: string;
  childId?: string;
  language: AIResponseLanguage;
}): string {
  const requester =
    String(params.requesterId ?? "anonymous").trim() || "anonymous";
  const child = String(params.childId ?? "global").trim() || "global";
  const role = normalizeRole(params.role);
  return `${requester}:${role}:${child}:${params.language}`;
}

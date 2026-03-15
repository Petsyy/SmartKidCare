import { z } from "zod";
import { askGemini } from "./gemini.service";
import { AIResponseLanguage } from "./language.service";
import { buildConversationClosureReply } from "./chatReply.service";
import { logAIInteraction } from "./datasetLogging.service";
import { buildFacts } from "./writer/facts.builders";
import {
  AIRole,
  WriterFacts,
  WriterResponseTemplate,
  WriterSupportedResult,
} from "./writer/types";

export type {
  AttendanceComparisonResult,
  ClassReportResult,
  FeedingComparisonResult,
} from "./writer/types";

type MemoryRole = "user" | "assistant";

type ConversationTurn = {
  role: MemoryRole;
  content: string;
};

const HISTORY_LIMIT = 8;
const writerMemory = new Map<string, ConversationTurn[]>();
const WRITER_MODE = (process.env.AI_WRITER_MODE ?? "").toLowerCase();
const USE_LLM_WRITER = WRITER_MODE === "llm";

const WriterOutputSchema = z.object({
  responseTemplate: z.enum(["fact", "advice", "alert"]),
  headline: z.string().min(1),
  metricLines: z.array(z.string().min(1)).min(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  analysis: z.string().min(1),
  suggestedActions: z.array(z.string().min(1)).max(3).optional(),
  followUp: z.string().optional(),
});

type WriterDisplayPolicy = {
  mode: "direct" | "structured";
  responseTemplate: WriterResponseTemplate;
  includeSuggestedActions: boolean;
  includeFollowUp: boolean;
  includeRiskLevel: boolean;
  detailMode: "compact" | "expanded";
};

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

function buildGroundTruthFromFacts(facts: WriterFacts): string {
  const subject = facts.childName?.trim().length
    ? facts.childName.trim()
    : facts.scenario.includes("class")
      ? "Class"
      : "Child";

  const metricSummary = facts.metricLines.join("; ");
  const primaryObservation = facts.observationLines[0]?.trim();

  return [
    `${subject} summary (${facts.timeframe}).`,
    metricSummary,
    `Risk Level: ${facts.riskLevel}.`,
    primaryObservation,
  ]
    .filter((line): line is string => Boolean(line))
    .join(" ");
}

function normalizeRole(role: string): AIRole {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === "teacher") return "teacher";
  if (normalized === "admin") return "admin";
  return "parent";
}

function timeframeLabel(
  timeframe: WriterFacts["timeframe"],
  language: AIResponseLanguage,
): string {
  if (language === "tl") {
    if (timeframe === "today") return "ngayong araw";
    if (timeframe === "week") return "ngayong linggo";
    if (timeframe === "last_week") return "nakaraang linggo";
    if (timeframe === "month") return "ngayong buwan";
    return "kamakailan";
  }
  if (timeframe === "today") return "today";
  if (timeframe === "week") return "this week";
  if (timeframe === "last_week") return "last week";
  if (timeframe === "month") return "this month";
  return "recently";
}

function sanitizeAction(text: string): string {
  return text
    .replace(/^[\-\u2022\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForGrounding(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractClaimTokens(text: string): string[] {
  const valueMatches =
    text.match(/\b\d+(?:\.\d+)?%|\b\d+\/\d+\b|\b\d+(?:\.\d+)?\b/g) ?? [];
  const isoDateMatches = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  const namedDateMatches =
    text.match(
      /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{1,2}(?:,\s*\d{4})?\b/gi,
    ) ?? [];

  return [...valueMatches, ...isoDateMatches, ...namedDateMatches].map(
    (token) => normalizeForGrounding(token),
  );
}

function isGroundedNarrative(params: {
  output: z.infer<typeof WriterOutputSchema>;
  facts: WriterFacts;
}): boolean {
  const { output, facts } = params;
  const factsCorpus = normalizeForGrounding(
    [
      ...facts.metricLines,
      ...facts.observationLines,
      ...facts.recommendationLines,
      String(facts.childName ?? ""),
      String(facts.timeframe ?? ""),
      String(facts.riskLevel ?? ""),
    ].join("\n"),
  );

  const outputCorpus = [
    output.headline,
    ...output.metricLines,
    output.analysis,
    ...(output.suggestedActions ?? []),
    output.followUp ?? "",
  ].join("\n");

  const claimTokens = extractClaimTokens(outputCorpus);
  if (claimTokens.length === 0) return true;

  return claimTokens.every((token) => factsCorpus.includes(token));
}

/**
 * Enforce consistent analysis length (50-150 words for consistency)
 */
function sanitizeAnalysis(analysis: string): string {
  const trimmed = analysis.trim();

  // Remove excessive punctuation marks and normalize whitespace
  const cleaned = trimmed
    .replace(/([.!?])\1{2,}/g, "$1")
    .replace(/\n{3,}/g, "\n");

  // Split into sentences and keep max 4 for consistency
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim())
    .slice(0, 4);

  // Join back and limit to ~150 words max
  const result = sentences.join(" ").trim();
  const words = result.split(/\s+/);

  if (words.length > 150) {
    return words.slice(0, 150).join(" ") + ".";
  }

  return result;
}

function ensureSentenceStartsUppercase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(/^[a-z]/, (char) => char.toUpperCase());
}

function sanitizeFollowUp(text: string): string {
  return text
    .trim()
    .replace(/^(?:follow[- ]?up|followup)\s*:\s*/i, "")
    .slice(0, 200);
}

type DirectQuestionKind =
  | "attendance_presence"
  | "attendance_absence_count"
  | "attendance_absence_dates"
  | "attendance_rate"
  | "attendance_comparison"
  | "feeding_meals"
  | "feeding_missed"
  | "feeding_rate"
  | "feeding_comparison"
  | "risk_level"
  | "recommendations"
  | "trend_snapshot"
  | "detail_lookup"
  | null;

function normalizedQuestion(question: string): string {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function isBroadSummaryIntent(question: string): boolean {
  const lower = normalizedQuestion(question);
  return /\b(summary|summarize|overall|status|report|update|overview|risk|why|recommend|recommendation|suggest|advice|next step|tips?|strategy|plan|trend|how is|how are|kamusta|kumusta|kalagayan)\b/.test(
    lower,
  );
}

function inferDirectQuestionKind(
  question: string,
  facts: WriterFacts,
): DirectQuestionKind {
  const lower = normalizedQuestion(question);
  const isAttendanceScenario =
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance";
  const isFeedingScenario =
    facts.scenario === "child_feeding" || facts.scenario === "class_feeding";

  if (
    facts.scenario === "child_attendance_comparison" &&
    /\b(improv\w*|compar\w*|versus|vs)\b/.test(lower)
  ) {
    return "attendance_comparison";
  }

  if (
    facts.scenario === "child_feeding_comparison" &&
    /\b(improv\w*|compar\w*|versus|vs)\b/.test(lower)
  ) {
    return "feeding_comparison";
  }

  if (
    facts.scenario === "child_trend" &&
    /\b(trend|last 30 days|30 days|history)\b/.test(lower)
  ) {
    return "trend_snapshot";
  }

  if (
    /\b(risk|risk level|high risk|medium risk|low risk)\b/.test(lower) &&
    (facts.scenario === "child_report" ||
      facts.scenario === "class_report" ||
      facts.scenario === "child_trend")
  ) {
    return "risk_level";
  }

  if (
    /\b(recommend|recommendation|suggest|advice|actions?|what should|next step|tips?|improve|strategy|plan)\b/.test(
      lower,
    )
  ) {
    return "recommendations";
  }

  if (isBroadSummaryIntent(lower)) return null;

  if (
    isAttendanceScenario &&
    /\b(was|is)\b/.test(lower) &&
    /\b(present|here|pumasok|pasok)\b/.test(lower)
  ) {
    return "attendance_presence";
  }

  if (
    isAttendanceScenario &&
    (/\bhow many\b/.test(lower) || /\bcount|number|total|ilan\b/.test(lower)) &&
    /\b(absences?|absent|lumiban|pagliban)\b/.test(lower)
  ) {
    return "attendance_absence_count";
  }

  if (
    isAttendanceScenario &&
    (/\bwhich dates?\b/.test(lower) ||
      /\bon which dates?\b/.test(lower) ||
      /\bwhat dates?\b/.test(lower) ||
      /\bwhen\b/.test(lower)) &&
    /\b(absent|absence|absences|lumiban|pagliban)\b/.test(lower)
  ) {
    return "attendance_absence_dates";
  }

  if (
    isAttendanceScenario &&
    /\b(rate|percentage|percent)\b/.test(lower) &&
    /\b(attendance|present|absence)\b/.test(lower)
  ) {
    return "attendance_rate";
  }

  if (
    isFeedingScenario &&
    (/\bwhat\b/.test(lower) ||
      /\bwhich\b/.test(lower) ||
      /\b(show|list)\b/.test(lower)) &&
    /\b(meals?|food|eat|ate|served|kinain|pagkain|ulam)\b/.test(lower)
  ) {
    return "feeding_meals";
  }

  if (
    isFeedingScenario &&
    (/\bmissed\b/.test(lower) ||
      /\bskip|skipped\b/.test(lower) ||
      lower.includes("didn't eat") ||
      lower.includes("did not eat") ||
      /\bhindi kumain|di kumain\b/.test(lower))
  ) {
    return "feeding_missed";
  }

  if (
    isFeedingScenario &&
    /\b(rate|percentage|percent|completion rate)\b/.test(lower) &&
    /\b(feed|feeding|meal|meals)\b/.test(lower)
  ) {
    return "feeding_rate";
  }

  if (
    (isAttendanceScenario || isFeedingScenario) &&
    (/\b(show|list|give me|tell me)\b/.test(lower) ||
      /\bdetail|details|specific|exact\b/.test(lower))
  ) {
    return "detail_lookup";
  }

  return null;
}

function shouldUseDirectAnswer(
  question: string,
  facts: WriterFacts,
): boolean {
  return inferDirectQuestionKind(question, facts) !== null;
}

function parseMetricFraction(
  line: string,
): { numerator: number; denominator: number; rate: number | null } | null {
  const match = line.match(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\D+\((\d+(?:\.\d+)?)%\)/);
  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  const rate = Number(match[3]);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  return {
    numerator,
    denominator,
    rate: Number.isFinite(rate) ? rate : null,
  };
}

function parseMetricRate(line: string): number | null {
  const match = line.match(/(\d+(?:\.\d+)?)%/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function firstMetricLine(
  facts: WriterFacts,
  prefixes: string[],
): string | undefined {
  return facts.metricLines.find((line) =>
    prefixes.some((prefix) => line.startsWith(prefix)),
  );
}

function firstDetailLine(
  detailLines: string[],
  prefixes: string[],
): string | undefined {
  return detailLines.find((line) =>
    prefixes.some((prefix) => line.startsWith(prefix)),
  );
}

function shouldIncludeGuidanceByIntent(question: string): boolean {
  const lower = question.toLowerCase();
  return /\b(recommend|recommendation|suggest|advice|what should|next step|tips?|improve|strategy|plan)\b/.test(
    lower,
  );
}

function shouldOfferFollowUpByIntent(
  question: string,
  facts: WriterFacts,
): boolean {
  const lower = question.toLowerCase();

  const asksSpecificDetail =
    /\b(detail|details|date[- ]by[- ]date|by date|specific|exact|which dates?|what food|meal history|attendance details|feeding details)\b/.test(
      lower,
    ) ||
    (/\b(show|list|give me|tell me)\b/.test(lower) &&
      /\b(attendance|feeding|absence|absences|meals?|food|dates?)\b/.test(
        lower,
      ));

  if (asksSpecificDetail) return false;

  const asksExplicitDeliverable =
    /\b(summary|summarize|summarise|report|overview|risk|recommend|recommendation|suggest|advice|actions?|trend|compare|comparison)\b/.test(
      lower,
    );

  if (asksExplicitDeliverable) return false;

  const asksBroadSummary =
    /\b(how is|how are|overall|status|update|kamusta|kumusta|kalagayan)\b/.test(
      lower,
    );

  if (asksBroadSummary) return true;

  return false;
}

function shouldExpandDetailsByIntent(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    /\b(detail|details|date[- ]by[- ]date|by date|specific|exact|which dates?|what food|meal history|attendance details|feeding details)\b/.test(
      lower,
    ) ||
    (/\b(show|list|give me|tell me)\b/.test(lower) &&
      /\b(attendance|feeding|absence|absences|meals?|food|dates?)\b/.test(
        lower,
      ))
  );
}

function buildWriterDisplayPolicy(params: {
  question: string;
  facts: WriterFacts;
  suppressFollowUp?: boolean;
  hasRecentFollowUp?: boolean;
}): WriterDisplayPolicy {
  const {
    question,
    facts,
    suppressFollowUp = false,
    hasRecentFollowUp = false,
  } = params;
  const mode = shouldUseDirectAnswer(question, facts) ? "direct" : "structured";
  const guidanceIntent = shouldIncludeGuidanceByIntent(question);
  const followUpIntent = shouldOfferFollowUpByIntent(question, facts);
  const detailMode = shouldExpandDetailsByIntent(question)
    ? "expanded"
    : "compact";
  const responseTemplate: WriterResponseTemplate =
    facts.riskLevel === "HIGH"
      ? "alert"
      : guidanceIntent
        ? "advice"
        : "fact";

  const includeSuggestedActions = mode === "structured" && guidanceIntent;
  const includeFollowUp =
    mode === "structured" &&
    followUpIntent &&
    !guidanceIntent &&
    !suppressFollowUp &&
    !hasRecentFollowUp;

  return {
    mode,
    responseTemplate,
    includeSuggestedActions,
    includeFollowUp,
    includeRiskLevel: mode === "structured",
    detailMode,
  };
}

function getHistory(conversationId: string): ConversationTurn[] {
  return [...(writerMemory.get(conversationId) ?? [])];
}

export function getConversationHistory(
  conversationId: string,
): ConversationTurn[] {
  return getHistory(conversationId);
}

function hasRecentAssistantFollowUp(history: ConversationTurn[]): boolean {
  const recentAssistantTurns = history
    .filter((turn) => turn.role === "assistant")
    .slice(-2);

  if (recentAssistantTurns.length === 0) return false;

  const followUpPattern =
    /(?:^|\n)\s*follow[- ]?up\s*:|would you like to|gusto mo bang/i;

  return recentAssistantTurns.some((turn) =>
    followUpPattern.test(turn.content),
  );
}

function remember(conversationId: string, turn: ConversationTurn): void {
  const current = writerMemory.get(conversationId) ?? [];
  const next = [...current, turn].slice(-HISTORY_LIMIT);
  writerMemory.set(conversationId, next);
}

function parseFirstJSONObject(rawText: string): unknown {
  const trimmed = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("invalid_writer_json");
  }
}

function safeJoinLines(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

function labelsForLanguage(language: AIResponseLanguage): {
  riskLabel: string;
  summaryLabel: string;
  keyDetailsLabel: string;
  suggestedActionsLabel: string;
  followUpLabel: string;
} {
  if (language === "tl") {
    return {
      riskLabel: "Antas ng Panganib",
      summaryLabel: "Buod",
      keyDetailsLabel: "Mahahalagang Detalye",
      suggestedActionsLabel: "Mga Mungkahing Hakbang",
      followUpLabel: "Follow-up",
    };
  }
  return {
    riskLabel: "Risk Level",
    summaryLabel: "Summary",
    keyDetailsLabel: "Key Details",
    suggestedActionsLabel: "Suggested Actions",
    followUpLabel: "Follow-up",
  };
}

function childReference(facts: WriterFacts): string | undefined {
  if (facts.role === "parent")
    return facts.language === "tl" ? "anak mo" : "your child";
  return facts.childName;
}

function deterministicHeadline(facts: WriterFacts): string {
  const subject = childReference(facts);
  const timeframe = timeframeLabel(facts.timeframe, facts.language);

  if (facts.language === "tl") {
    if (facts.scenario === "class_report")
      return `Narito ang class summary ${timeframe}.`;
    if (subject) return `Narito ang update ng ${subject} ${timeframe}.`;
    return `Narito ang update ${timeframe}.`;
  }

  if (facts.scenario === "class_report")
    return `Here is the class summary ${timeframe}.`;
  if (subject) return `Here is ${subject}'s update ${timeframe}.`;
  return `Here is the update ${timeframe}.`;
}

function isObservationDetailLine(line: string): boolean {
  const normalized = line.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.startsWith("absence date:") ||
    normalized.startsWith("absence dates:") ||
    normalized.startsWith("pagliban:") ||
    normalized.startsWith("mga araw ng pagliban:") ||
    normalized.startsWith("meals served:") ||
    normalized.startsWith("mga inihain na pagkain:") ||
    normalized.startsWith("trend snapshot") ||
    /^\d{4}-\d{2}-\d{2}\b/.test(normalized)
  );
}

function splitObservationLines(facts: WriterFacts): {
  summaryLines: string[];
  detailLines: string[];
} {
  if (facts.scenario === "child_trend") {
    return {
      summaryLines: [],
      detailLines: facts.observationLines
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  const summaryLines: string[] = [];
  const detailLines: string[] = [];

  for (const line of facts.observationLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isObservationDetailLine(trimmed)) {
      detailLines.push(trimmed);
      continue;
    }

    summaryLines.push(trimmed);
  }

  return { summaryLines, detailLines };
}

function genericSummaryFromFacts(facts: WriterFacts): string {
  const timeframe = timeframeLabel(facts.timeframe, facts.language);
  const combinedScenario =
    facts.scenario === "child_report" ||
    facts.scenario === "class_report" ||
    facts.scenario === "child_trend";
  const attendanceScenario =
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance" ||
    facts.scenario === "child_attendance_comparison";
  const feedingScenario =
    facts.scenario === "child_feeding" || facts.scenario === "class_feeding";

  if (facts.language === "tl") {
    if (combinedScenario) {
      if (facts.riskLevel === "HIGH") {
        return `Kailangan ng mas agarang pagtingin sa attendance at feeding ${timeframe}.`;
      }
      if (facts.riskLevel === "MEDIUM") {
        return `May mga bahagi sa attendance at feeding na dapat bantayan ${timeframe}.`;
      }
      return `Mukhang stable ang attendance at feeding ${timeframe}.`;
    }

    if (attendanceScenario) {
      if (facts.riskLevel === "HIGH") {
        return `Kailangan ng agarang follow-up sa attendance ${timeframe}.`;
      }
      if (facts.riskLevel === "MEDIUM") {
        return `Dapat bantayan nang mas malapitan ang attendance ${timeframe}.`;
      }
      return `Mukhang stable ang attendance ${timeframe}.`;
    }

    if (facts.riskLevel === "HIGH") {
      return `Kailangan ng agarang atensyon sa feeding consistency ${timeframe}.`;
    }
    if (facts.riskLevel === "MEDIUM") {
      return `Dapat bantayan nang mas malapitan ang feeding consistency ${timeframe}.`;
    }
    return `Mukhang stable ang feeding consistency ${timeframe}.`;
  }

  if (combinedScenario) {
    if (facts.riskLevel === "HIGH") {
      return `Attendance and feeding need prompt review ${timeframe}.`;
    }
    if (facts.riskLevel === "MEDIUM") {
      return `Attendance and feeding should be monitored more closely ${timeframe}.`;
    }
    return `Attendance and feeding look stable ${timeframe}.`;
  }

  if (attendanceScenario) {
    if (facts.riskLevel === "HIGH") {
      return `Attendance needs prompt follow-up ${timeframe}.`;
    }
    if (facts.riskLevel === "MEDIUM") {
      return `Attendance should be monitored more closely ${timeframe}.`;
    }
    return `Attendance looks stable ${timeframe}.`;
  }

  if (facts.riskLevel === "HIGH") {
    return `Feeding consistency needs prompt attention ${timeframe}.`;
  }
  if (facts.riskLevel === "MEDIUM") {
    return `Feeding consistency should be monitored more closely ${timeframe}.`;
  }
  return `Feeding consistency looks stable ${timeframe}.`;
}

function detailScopeForNarrative(facts: WriterFacts): string {
  const timeframe = timeframeLabel(facts.timeframe, facts.language);
  const isParent = facts.role === "parent";

  if (facts.language === "tl") {
    if (facts.timeframe === "recent") {
      return isParent
        ? " mula sa recent records ng anak mo"
        : " mula sa recent records";
    }
    return isParent ? ` para sa anak mo ${timeframe}` : ` para sa ${timeframe}`;
  }

  if (facts.timeframe === "recent") {
    return isParent
      ? " from your child's recent records"
      : " from the recent records";
  }

  return isParent ? ` for your child ${timeframe}` : ` for ${timeframe}`;
}

function buildFollowUp(
  policy: WriterDisplayPolicy,
  facts: WriterFacts,
): string | undefined {
  if (!policy.includeFollowUp) return undefined;
  const labels = labelsForLanguage(facts.language);
  const detailScope = detailScopeForNarrative(facts);

  if (facts.language === "tl") {
    if (
      facts.scenario === "child_attendance" ||
      facts.scenario === "class_attendance" ||
      facts.scenario === "child_attendance_comparison"
    ) {
      return `${labels.followUpLabel}: Gusto mo bang makita ang date-by-date attendance details${detailScope}?`;
    }

    if (
      facts.scenario === "child_feeding" ||
      facts.scenario === "class_feeding" ||
      facts.scenario === "child_feeding_comparison"
    ) {
      return `${labels.followUpLabel}: Gusto mo bang makita ang feeding details${detailScope}?`;
    }

    return `${labels.followUpLabel}: Gusto mo bang makita ang attendance details, feeding details, o pareho${detailScope}?`;
  }

  if (
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance" ||
    facts.scenario === "child_attendance_comparison"
  ) {
    return `${labels.followUpLabel}: Would you like date-by-date attendance details${detailScope}?`;
  }

  if (
    facts.scenario === "child_feeding" ||
    facts.scenario === "class_feeding" ||
    facts.scenario === "child_feeding_comparison"
  ) {
    return `${labels.followUpLabel}: Would you like feeding details${detailScope}?`;
  }

  return `${labels.followUpLabel}: Would you like attendance details, feeding details, or both${detailScope}?`;
}

function ensureActions(
  recommendationLines: string[],
  language: AIResponseLanguage,
  required: boolean,
): string[] {
  const cleaned = recommendationLines
    .map((line) => sanitizeAction(line))
    .filter(Boolean)
    .slice(0, 3);

  if (cleaned.length || !required) return cleaned;

  if (language === "tl") {
    return [
      "I-record ang attendance at feeding nang tuloy-tuloy para makita ang trend.",
      "Mag-follow up sa teacher kung may na-miss na araw o pagkain.",
    ];
  }
  return [
    "Keep logging attendance and meals consistently to track trends.",
    "Follow up with the teacher on any missed days or meals.",
  ];
}

function buildAnalysisFromFacts(facts: WriterFacts): string {
  const { summaryLines } = splitObservationLines(facts);
  const summaryText =
    summaryLines.join(" ").trim() || genericSummaryFromFacts(facts);
  return ensureSentenceStartsUppercase(sanitizeAnalysis(summaryText));
}

function truncateNamedListLine(params: {
  line: string;
  prefixes: string[];
  maxItems: number;
}): string {
  const { line, prefixes, maxItems } = params;
  const matchedPrefix = prefixes.find((prefix) => line.startsWith(prefix));
  if (!matchedPrefix) return line;

  const rawContent = line.slice(matchedPrefix.length).trim();
  const suffix = rawContent.endsWith(".") ? "." : "";
  const normalizedContent = rawContent.replace(/\.$/, "");
  const items = normalizedContent
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length <= maxItems) return line;

  const shown = items.slice(0, maxItems).join(", ");
  const remaining = items.length - maxItems;
  return `${matchedPrefix} ${shown}, +${remaining} more${suffix}`;
}

function formatDetailLineForQuestion(
  line: string,
  policy: WriterDisplayPolicy,
  language: AIResponseLanguage,
): string {
  if (policy.detailMode === "expanded") return line;

  if (language === "tl") {
    return truncateNamedListLine({
      line: truncateNamedListLine({
        line,
        prefixes: ["Mga araw ng pagliban:"],
        maxItems: 3,
      }),
      prefixes: ["Mga inihain na pagkain:"],
      maxItems: 4,
    });
  }

  return truncateNamedListLine({
    line: truncateNamedListLine({
      line,
      prefixes: ["Absence dates:"],
      maxItems: 3,
    }),
    prefixes: ["Meals served:"],
    maxItems: 4,
  });
}

function buildDetailLines(
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string[] {
  return splitObservationLines(facts).detailLines.map((line) =>
    formatDetailLineForQuestion(line, policy, facts.language),
  );
}

function directSubject(facts: WriterFacts): string {
  const reference = childReference(facts);
  if (reference) return reference;
  return facts.language === "tl" ? "ang bata" : "the child";
}

function sentenceSubject(facts: WriterFacts): string {
  return ensureSentenceStartsUppercase(directSubject(facts));
}

function possessiveSubject(facts: WriterFacts): string {
  const subject = directSubject(facts);
  if (facts.language === "tl") return subject;
  if (subject === "your child") return "Your child's";
  return `${ensureSentenceStartsUppercase(subject)}'s`;
}

function recommendationFocus(facts: WriterFacts): string {
  if (facts.language === "tl") {
    if (
      facts.scenario === "child_attendance" ||
      facts.scenario === "class_attendance" ||
      facts.scenario === "child_attendance_comparison"
    ) {
      return "attendance";
    }
    if (
      facts.scenario === "child_feeding" ||
      facts.scenario === "class_feeding" ||
      facts.scenario === "child_feeding_comparison"
    ) {
      return "feeding";
    }
    return "attendance at feeding";
  }

  if (
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance" ||
    facts.scenario === "child_attendance_comparison"
  ) {
    return "attendance";
  }
  if (
    facts.scenario === "child_feeding" ||
    facts.scenario === "class_feeding" ||
    facts.scenario === "child_feeding_comparison"
  ) {
    return "feeding";
  }
  return "attendance and feeding";
}

function parseSignedRate(line: string): number | null {
  const match = line.match(/([+-]?\d+(?:\.\d+)?)%/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function buildDirectAnswerNarrative(params: {
  question: string;
  facts: WriterFacts;
  policy: WriterDisplayPolicy;
}): string {
  const { question, facts, policy } = params;
  const kind = inferDirectQuestionKind(question, facts);
  const timeframe = timeframeLabel(facts.timeframe, facts.language);
  const subject = directSubject(facts);
  const detailLines = buildDetailLines(facts, policy);
  const attendanceLine = firstMetricLine(facts, ["Attendance"]);
  const feedingLine = firstMetricLine(facts, ["Feeding Completion"]);
  const changeLine = firstMetricLine(facts, ["Change:", "Pagbabago:"]);
  const summaryLine = buildAnalysisFromFacts(facts);
  const actions = ensureActions(facts.recommendationLines, facts.language, false);

  if (
    kind === "attendance_presence" ||
    kind === "attendance_absence_count" ||
    kind === "attendance_absence_dates" ||
    kind === "attendance_rate" ||
    kind === "detail_lookup"
  ) {
    const metricLine = attendanceLine;
    const metric = metricLine ? parseMetricFraction(metricLine) : null;
    const absences =
      metric && Number.isFinite(metric.denominator - metric.numerator)
        ? metric.denominator - metric.numerator
        : null;
    const absenceLine = firstDetailLine(detailLines, [
      "Absence date:",
      "Absence dates:",
      "Pagliban:",
      "Mga araw ng pagliban:",
    ]);

    if (facts.language === "tl") {
      const noRecord = `Walang available na attendance record para sa ${subject} ${timeframe}.`;

      if (kind === "attendance_presence") {
        const lead =
          !metric || metric.denominator === 0
            ? noRecord
            : metric.numerator > 0
              ? `Oo, present ang ${subject} ${timeframe}.`
              : `Hindi, absent ang ${subject} ${timeframe}.`;
        return [lead, metricLine].filter(Boolean).join("\n");
      }

      if (kind === "attendance_absence_count") {
        const lead =
          absences === null
            ? noRecord
            : `May ${absences} absence ang ${subject} ${timeframe}.`;
        return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
      }

      if (kind === "attendance_absence_dates") {
        const lead = absenceLine
          ? `Ito ang recorded absence dates ng ${subject} ${timeframe}.`
          : `Walang recorded absences ang ${subject} ${timeframe}.`;
        return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
      }

      const lead =
        !metricLine || !metric
          ? noRecord
          : kind === "attendance_rate"
            ? `Ang attendance rate ng ${subject} ${timeframe} ay ${metricLine.replace(/^Attendance:\s*/, "")}.`
            : `Narito ang attendance details ng ${subject} ${timeframe}.`;
      return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
    }

    const noRecord = `There is no recorded attendance data for ${subject} ${timeframe}.`;

    if (kind === "attendance_presence") {
      const lead =
        !metric || metric.denominator === 0
          ? noRecord
          : metric.numerator > 0
            ? `Yes, ${subject} was present ${timeframe}.`
            : `No, ${subject} was absent ${timeframe}.`;
      return [lead, metricLine].filter(Boolean).join("\n");
    }

    if (kind === "attendance_absence_count") {
      const lead =
        absences === null
          ? noRecord
          : `${sentenceSubject(facts)} had ${absences} absence${absences === 1 ? "" : "s"} ${timeframe}.`;
      return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
    }

    if (kind === "attendance_absence_dates") {
      const lead = absenceLine
        ? `These are the recorded absence dates for ${subject} ${timeframe}.`
        : `${sentenceSubject(facts)} had no recorded absences ${timeframe}.`;
      return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
    }

    const lead =
      !metricLine || !metric
        ? noRecord
        : kind === "attendance_rate"
          ? `${possessiveSubject(facts)} attendance rate ${timeframe} was ${metricLine.replace(/^Attendance:\s*/, "")}.`
          : `Here are the attendance details for ${subject} ${timeframe}.`;
    return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
  }

  if (
    kind === "feeding_meals" ||
    kind === "feeding_missed" ||
    kind === "feeding_rate"
  ) {
    const metricLine = feedingLine;
    const metric = metricLine ? parseMetricFraction(metricLine) : null;
    const missed =
      metric && Number.isFinite(metric.denominator - metric.numerator)
        ? metric.denominator - metric.numerator
        : null;
    const mealsLine = firstDetailLine(detailLines, [
      "Meals served:",
      "Mga inihain na pagkain:",
    ]);

    if (facts.language === "tl") {
      const noRecord = `Walang available na feeding record para sa ${subject} ${timeframe}.`;

      if (kind === "feeding_meals") {
        const lead = metric
          ? missed === 0
            ? `${subject} completed all ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
            : `${subject} completed ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
          : noRecord;
        const limitation =
          mealsLine && missed !== null && missed > 0
            ? "Ipinapakita ng meal list kung ano ang inihain, pero hindi nito tinutukoy kung aling partikular na meal ang na-miss."
            : undefined;
        return [lead, metricLine, mealsLine, limitation].filter(Boolean).join("\n");
      }

      if (kind === "feeding_missed") {
        const lead =
          missed === null
            ? noRecord
            : missed === 0
              ? `Walang recorded missed meals ang ${subject} ${timeframe}.`
              : `May ${missed} missed meal${missed === 1 ? "" : "s"} ang ${subject} ${timeframe}.`;
        return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
      }

      const lead =
        !metricLine || !metric
          ? noRecord
          : `Ang feeding completion rate ng ${subject} ${timeframe} ay ${metricLine.replace(/^Feeding Completion:\s*/, "")}.`;
      return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
    }

    const noRecord = `There is no recorded feeding data for ${subject} ${timeframe}.`;

    if (kind === "feeding_meals") {
      const lead = metric
        ? missed === 0
          ? `${sentenceSubject(facts)} completed all ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
          : `${sentenceSubject(facts)} completed ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
        : noRecord;
      const limitation =
        mealsLine && missed !== null && missed > 0
          ? "The meal list shows what was served, but the records do not identify which specific meal was missed."
          : undefined;
      return [lead, metricLine, mealsLine, limitation].filter(Boolean).join("\n");
    }

    if (kind === "feeding_missed") {
      const lead =
        missed === null
          ? noRecord
          : missed === 0
            ? `${sentenceSubject(facts)} did not miss any recorded meals ${timeframe}.`
            : `${sentenceSubject(facts)} missed ${missed} meal${missed === 1 ? "" : "s"} ${timeframe}.`;
      return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
    }

    const lead =
      !metricLine || !metric
        ? noRecord
        : `${possessiveSubject(facts)} feeding completion rate ${timeframe} was ${metricLine.replace(/^Feeding Completion:\s*/, "")}.`;
    return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
  }

  if (kind === "risk_level") {
    if (facts.language === "tl") {
      const lead = `Ang kasalukuyang risk level ng ${subject} ay ${facts.riskLevel}.`;
      return [
        lead,
        ...facts.metricLines,
        `Dahilan: ${summaryLine}`,
        ...detailLines.slice(0, 2),
      ]
        .filter(Boolean)
        .join("\n");
    }

    const lead = `${possessiveSubject(facts)} current risk level is ${facts.riskLevel}.`;
    return [lead, ...facts.metricLines, `Reason: ${summaryLine}`, ...detailLines.slice(0, 2)]
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "recommendations") {
    const actionLines = actions.map((line) => `- ${line}`);

    if (facts.language === "tl") {
      const lead = `Narito ang mga inirerekomendang hakbang para mapabuti ang ${recommendationFocus(
        facts,
      )} para kay ${subject}.`;
      return [lead, ...actionLines, `Batayan: ${summaryLine}`, ...facts.metricLines]
        .filter(Boolean)
        .join("\n");
    }

    const lead = `Here are the recommended actions to improve ${recommendationFocus(
      facts,
    )} for ${subject}.`;
    return [lead, ...actionLines, `Reason: ${summaryLine}`, ...facts.metricLines]
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "trend_snapshot") {
    if (facts.language === "tl") {
      const lead = `Narito ang maikling trend para kay ${subject} sa nakaraang 30 araw.`;
      return [lead, ...facts.metricLines, ...detailLines].filter(Boolean).join("\n");
    }

    const lead = `Here is a short trend for ${subject} over the last 30 days.`;
    return [lead, ...facts.metricLines, ...detailLines].filter(Boolean).join("\n");
  }

  if (kind === "attendance_comparison" || kind === "feeding_comparison") {
    const comparisonLines = facts.metricLines;
    const delta = changeLine ? parseSignedRate(changeLine) : null;

    if (facts.language === "tl") {
      const lead =
        delta === null
          ? `Narito ang comparison para kay ${subject} ${timeframe}.`
          : delta > 0
            ? `${kind === "attendance_comparison" ? "Mas bumuti" : "Mas bumuti"} ng ${delta}% ang ${kind === "attendance_comparison" ? "attendance" : "feeding"} kumpara sa nakaraang linggo.`
            : delta < 0
              ? `Bumaba ng ${Math.abs(delta)}% ang ${kind === "attendance_comparison" ? "attendance" : "feeding"} kumpara sa nakaraang linggo.`
              : `Walang pagbabago sa ${kind === "attendance_comparison" ? "attendance" : "feeding"} kumpara sa nakaraang linggo.`;
      const comparisonDetail =
        kind === "feeding_comparison"
          ? firstDetailLine(detailLines, [
              "Meals served:",
              "Mga inihain na pagkain:",
            ])
          : firstDetailLine(detailLines, [
              "Absence date:",
              "Absence dates:",
              "Pagliban:",
              "Mga araw ng pagliban:",
            ]);
      return [lead, ...comparisonLines, comparisonDetail]
        .filter(Boolean)
        .join("\n");
    }

    const metricName =
      kind === "attendance_comparison" ? "Attendance" : "Feeding";
    const lead =
      delta === null
        ? `Here is the ${metricName.toLowerCase()} comparison for ${subject} ${timeframe}.`
        : delta > 0
          ? `${metricName} improved by ${delta}% compared with last week.`
          : delta < 0
            ? `${metricName} declined by ${Math.abs(delta)}% compared with last week.`
            : `${metricName} is unchanged compared with last week.`;
    const comparisonDetail =
      kind === "feeding_comparison"
        ? firstDetailLine(detailLines, ["Meals served:", "Mga inihain na pagkain:"])
        : firstDetailLine(detailLines, [
            "Absence date:",
            "Absence dates:",
            "Pagliban:",
            "Mga araw ng pagliban:",
          ]);
    return [lead, ...comparisonLines, comparisonDetail]
      .filter(Boolean)
      .join("\n");
  }

  return [
    deterministicHeadline(facts),
    ...facts.metricLines,
    ...detailLines,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildEvaluationArtifacts(params: {
  answer: string;
  facts: WriterFacts;
  policy: WriterDisplayPolicy;
}): { contexts: string[]; groundTruth: string } {
  const { answer, facts, policy } = params;
  const detailLines = splitObservationLines(facts).detailLines.map((line) =>
    line.trim(),
  );
  const actions = ensureActions(facts.recommendationLines, facts.language, false);
  const followUp = buildFollowUp(policy, facts);
  const contexts = [
    facts.childName?.trim() ? `Child: ${facts.childName.trim()}` : undefined,
    `Timeframe: ${facts.timeframe}`,
    `Scenario: ${facts.scenario}`,
    ...facts.metricLines,
    `Risk Level: ${facts.riskLevel}`,
    `Summary: ${buildAnalysisFromFacts(facts)}`,
    ...detailLines.map((line) => `Key Detail: ${line}`),
    ...actions.map((line) => `Suggested Action: ${line}`),
    followUp ? `Follow-up Prompt: ${followUp}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return {
    contexts,
    // Ground truth must be independently derived from facts, not copied from model output.
    groundTruth: buildGroundTruthFromFacts(facts),
  };
}

function buildDeterministicNarrative(
  question: string,
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string {
  if (policy.mode === "direct") {
    return buildDirectAnswerNarrative({ question, facts, policy });
  }

  const labels = labelsForLanguage(facts.language);
  const headline = deterministicHeadline(facts);
  const metrics = safeJoinLines(facts.metricLines);
  const analysis = buildAnalysisFromFacts(facts);
  const detailLines = buildDetailLines(facts, policy);
  const actions = policy.includeSuggestedActions
    ? ensureActions(facts.recommendationLines, facts.language, true)
    : [];
  const followUp = buildFollowUp(policy, facts);

  return [
    headline,
    "",
    metrics,
    policy.includeRiskLevel ? "" : undefined,
    policy.includeRiskLevel ? `${labels.riskLabel}: ${facts.riskLevel}` : undefined,
    policy.includeRiskLevel ? "" : undefined,
    `${labels.summaryLabel}:`,
    analysis,
    detailLines.length ? "" : undefined,
    detailLines.length ? `${labels.keyDetailsLabel}:` : undefined,
    ...detailLines.map((line) => `- ${line}`),
    actions.length ? "" : undefined,
    actions.length ? `${labels.suggestedActionsLabel}:` : undefined,
    ...actions.map((line) => `- ${line}`),
    followUp ? "" : undefined,
    followUp,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function validateWriterOutput(
  output: z.infer<typeof WriterOutputSchema>,
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): boolean {
  if (output.responseTemplate !== policy.responseTemplate) return false;
  if (output.riskLevel !== facts.riskLevel) return false;
  if (output.metricLines.length !== facts.metricLines.length) return false;
  const allMetricsMatch = output.metricLines.every(
    (line, index) => line.trim() === facts.metricLines[index].trim(),
  );
  if (!allMetricsMatch) return false;

  const actionCount = (output.suggestedActions ?? [])
    .map((line) => line.trim())
    .filter(Boolean).length;
  const hasFollowUp = (output.followUp ?? "").trim().length > 0;

  if (policy.includeSuggestedActions && actionCount < 1) return false;
  if (!policy.includeSuggestedActions && actionCount > 0) return false;
  if (policy.includeFollowUp && !hasFollowUp) return false;

  return true;
}

function renderWriterOutput(
  output: z.infer<typeof WriterOutputSchema>,
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string {
  const labels = labelsForLanguage(facts.language);
  const headline = output.headline.trim() || deterministicHeadline(facts);
  const analysis = ensureSentenceStartsUppercase(
    sanitizeAnalysis(output.analysis || buildAnalysisFromFacts(facts)),
  );
  const detailLines = buildDetailLines(facts, policy);
  const suggestedActions = policy.includeSuggestedActions
    ? ensureActions(facts.recommendationLines, facts.language, true)
    : [];
  const followUp =
    buildFollowUp(policy, facts) ||
    (policy.includeFollowUp && sanitizeFollowUp(output.followUp ?? "")
      ? `${labels.followUpLabel}: ${sanitizeFollowUp(output.followUp ?? "")}`
      : undefined);

  return [
    headline,
    "",
    safeJoinLines(facts.metricLines.map((line) => line.trim())),
    policy.includeRiskLevel ? "" : undefined,
    policy.includeRiskLevel ? `${labels.riskLabel}: ${facts.riskLevel}` : undefined,
    policy.includeRiskLevel ? "" : undefined,
    `${labels.summaryLabel}:`,
    analysis,
    detailLines.length ? "" : undefined,
    detailLines.length ? `${labels.keyDetailsLabel}:` : undefined,
    ...detailLines.map((line) => `- ${line}`),
    suggestedActions.length ? "" : undefined,
    suggestedActions.length ? `${labels.suggestedActionsLabel}:` : undefined,
    ...suggestedActions.map((line) => `- ${line}`),
    followUp ? "" : undefined,
    followUp,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function buildDeterministicNarrativeForFacts(params: {
  question: string;
  facts: WriterFacts;
  suppressFollowUp?: boolean;
  hasRecentFollowUp?: boolean;
}): string {
  const policy = buildWriterDisplayPolicy({
    question: params.question,
    facts: params.facts,
    suppressFollowUp: params.suppressFollowUp,
    hasRecentFollowUp: params.hasRecentFollowUp,
  });

  return buildDeterministicNarrative(params.question, params.facts, policy);
}

export function buildEvaluationArtifactsForFacts(params: {
  question: string;
  facts: WriterFacts;
  suppressFollowUp?: boolean;
  hasRecentFollowUp?: boolean;
}): { answer: string; contexts: string[]; groundTruth: string } {
  const policy = buildWriterDisplayPolicy({
    question: params.question,
    facts: params.facts,
    suppressFollowUp: params.suppressFollowUp,
    hasRecentFollowUp: params.hasRecentFollowUp,
  });
  const answer = buildDeterministicNarrative(params.question, params.facts, policy);
  const evaluation = buildEvaluationArtifacts({
    answer,
    facts: params.facts,
    policy,
  });

  return {
    answer,
    contexts: evaluation.contexts,
    groundTruth: evaluation.groundTruth,
  };
}

function buildWriterPrompt(params: {
  facts: WriterFacts;
  role: AIRole;
  language: AIResponseLanguage;
  question: string;
  history: ConversationTurn[];
  policy: WriterDisplayPolicy;
}): string {
  const { facts, role, language, question, history, policy } = params;
  const historyText =
    history.length === 0
      ? "None"
      : history
          .slice(-8)
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join("\n");

  return `
You are SmartKidCare's narrative AI layer.
Generate a fully structured response based ONLY on deterministic facts.

Return ONLY one valid JSON object with this exact shape:
{
  "responseTemplate":"fact|advice|alert",
  "headline":"string",
  "metricLines":["string"],
  "riskLevel":"LOW|MEDIUM|HIGH",
  "analysis":"string",
  "suggestedActions":["string"],
  "followUp":"string"
}

Hard constraints:
- Response language: ${language === "tl" ? "Filipino/Tagalog" : "English"}.
- Audience role: ${role}.
- IMPORTANT: When addressing parents, use "your child" (or "anak mo" in Tagalog) instead of the child's name. For teachers/admins, use the actual child name.
- Use FACTS as source of truth. Never invent or modify numbers, percentages, dates, or counts.
- If a detail is not in FACTS (for example exact dates, reasons, comparisons, or meal names), explicitly say it is not available in the provided records.
- Never mention a specific date unless that exact date string appears in FACTS.
- metricLines must be copied EXACTLY from FACTS.metricLines, same order, same text.
- riskLevel must be exactly FACTS.riskLevel.
- responseTemplate must be exactly "${policy.responseTemplate}".
- ANALYSIS CONSTRAINT: Keep to 2-4 sentences maximum (~100-150 words). Be concise and practical.
- If responseTemplate is "fact": analysis should be factual summary only, no action coaching.
- If responseTemplate is "advice": analysis should interpret facts and set up recommended actions below.
- If responseTemplate is "alert": analysis should clearly state the concern grounded in FACTS with urgency.
- suggestedActions policy: ${policy.includeSuggestedActions ? "REQUIRED: provide exactly 2-3 concise actionable items (1 sentence each, max 20 words each). DO NOT return empty array." : "not needed (return empty array [])"}.
- followUp policy: ${policy.includeFollowUp ? "REQUIRED: 1 short contextual follow-up question (max 15 words). DO NOT return empty string." : 'not needed (return empty string "")'}.
- Plain text values only. No markdown/code fences/formatting.

Recent conversation memory:
${historyText}

Current user question:
${question}

FACTS:
${JSON.stringify(facts, null, 2)}
`.trim();
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
  // Extract child-specific data from the result
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

  // For class-level queries, log simplified context
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

  // Fallback for other scenarios
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
  const displayPolicy = buildWriterDisplayPolicy({
    question: params.question,
    facts,
    suppressFollowUp: params.suppressFollowUp,
    hasRecentFollowUp: hasRecentAssistantFollowUp(
      getHistory(params.conversationId),
    ),
  });

  const deterministicReply = buildDeterministicNarrative(
    params.question,
    facts,
    displayPolicy,
  );
  let finalReply = deterministicReply;

  if (USE_LLM_WRITER && displayPolicy.mode === "structured") {
    const history = getHistory(params.conversationId);
    const prompt = buildWriterPrompt({
      facts,
      role,
      language: params.language,
      question: params.question,
      history,
      policy: displayPolicy,
    });

    try {
      const raw = await askGemini(prompt, { mode: "json" });
      const parsedUnknown = parseFirstJSONObject(raw);
      const validated = WriterOutputSchema.parse(parsedUnknown);

      if (
        validateWriterOutput(validated, facts, displayPolicy) &&
        isGroundedNarrative({ output: validated, facts })
      ) {
        finalReply = renderWriterOutput(validated, facts, displayPolicy);
      }
    } catch {
      finalReply = deterministicReply;
    }
  }

  // Log interaction to datasets
  const loggingContext = buildLoggingContext(facts, params.result);
  const evaluationArtifacts = buildEvaluationArtifacts({
    answer: finalReply,
    facts,
    policy: displayPolicy,
  });
  await logAIInteraction(
    params.question,
    loggingContext,
    finalReply,
    ragasCategoryFromScenario(facts.scenario),
    evaluationArtifacts.groundTruth,
    evaluationArtifacts,
  );

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

  const historyText =
    history.length === 0
      ? "None"
      : history
          .slice(-8)
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join("\n");

  const prompt = `
You are SmartKidCare's assistant.
Write a polite conversation-closing response.

Rules:
- Language: ${params.language === "tl" ? "Filipino/Tagalog" : "English"}.
- Audience role: ${role}.
- Keep it to 1-2 concise sentences.
- Thank the user and invite them to ask again anytime about attendance/feeding.
- Plain text only. No markdown/code fences.

Recent conversation memory:
${historyText}

User closing message:
${params.message}
`.trim();

  let reply = "";
  try {
    reply = (await askGemini(prompt, { mode: "text" })).trim();
  } catch {
    reply = "";
  }

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

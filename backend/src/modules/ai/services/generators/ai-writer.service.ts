/**
 * AI Writer Service
 * 
 * Orchestrates: Memory, Fact Building, LLM Generation, and Display Policies.
 */
import { z } from "zod";
import { askGemini } from "../core/gemini.service";
import type { AIResponseLanguage } from "../../types/core-ai-chat.types";
import type { AIChatReply, AIRiskLevel } from "../../types/core-ai-chat.types";
import { 
  AIRole, 
  WriterFacts, 
  WriterStructuredOutput, 
  WriterDisplayPolicy,
  renderWriterOutput,
  buildDeterministicNarrative
} from "./ai-writer-render.service";
import { remember } from "../../repositories/ai-state.repository";
import type { ConversationTurn } from "../../types/generators-ai-writer.types";
import { timeframeLabel } from "../../constants/chat-language.constants";

// ─── Memory Management ──────────────────────────────────────────────
// ─── Policy & LLM Logic ─────────────────────────────────────────────

const WriterOutputSchema = z.object({
  responseTemplate: z.enum(["fact", "advice", "alert"]),
  headline: z.string().trim().min(1).max(500),
  metricLines: z.array(z.string().trim().min(1).max(500)).max(10),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  analysis: z.string().trim().min(1).max(1500),
  suggestedActions: z.array(z.string().trim().min(1).max(500)).max(5).optional(),
  followUp: z.string().trim().min(1).max(500).optional(),
}).strict();

const riskFromResult = (result: any): AIRiskLevel => {
  const rates = [
    result?.attendanceRate,
    result?.feedingRate,
    result?.attendance?.attendanceRate,
    result?.feeding?.feedingRate,
    result?.currentWeek?.attendanceRate,
    result?.currentWeek?.feedingRate,
  ].filter((value): value is number => typeof value === "number");
  const rate = rates.length ? Math.min(...rates) : 100;
  return rate < 80 ? "HIGH" : "LOW";
};

const scenarioFromTool = (tool: string): WriterFacts["scenario"] => {
  if (tool === "generate_child_report") return "child_report";
  if (tool === "summarize_child_trend") return "child_trend";
  if (tool === "summarize_attendance_comparison") return "child_attendance_comparison";
  if (tool === "summarize_feeding_comparison") return "child_feeding_comparison";
  return tool.includes("attendance") ? "child_attendance" : "child_feeding";
};

const clearlyWrongLanguage = (
  value: WriterStructuredOutput,
  language: AIResponseLanguage,
): boolean => {
  const text = [
    value.headline,
    value.analysis,
    ...value.metricLines,
    ...(value.suggestedActions ?? []),
    value.followUp ?? "",
  ].join(" ").toLowerCase();
  const filipinoMarkers = text.match(/\b(ang|ng|mga|iyong|anak|narito|para|dahil|maaari|dapat|ngayon)\b/g)?.length ?? 0;
  const englishMarkers = text.match(/\b(the|your|child|here|because|should|this|has|was|were)\b/g)?.length ?? 0;
  return language === "fil"
    ? englishMarkers >= 3 && filipinoMarkers === 0
    : filipinoMarkers >= 3 && englishMarkers === 0;
};

const clearlyWrongTextLanguage = (
  text: string,
  language: AIResponseLanguage,
): boolean => {
  const normalized = text.toLowerCase();
  const filipinoMarkers = normalized.match(/\b(ang|ng|mga|iyong|anak|narito|para|dahil|maaari|salamat|walang)\b/g)?.length ?? 0;
  const englishMarkers = normalized.match(/\b(the|your|child|here|because|should|thank|welcome|records)\b/g)?.length ?? 0;
  return language === "fil"
    ? englishMarkers >= 3 && filipinoMarkers === 0
    : filipinoMarkers >= 3 && englishMarkers === 0;
};

export async function writeToolNarrative(params: {
  result: any;
  role: string;
  question: string;
  language: AIResponseLanguage;
  conversationId: string;
  suppressFollowUp?: boolean;
}): Promise<AIChatReply> {
  const { result, question, language, conversationId } = params;
  const role: AIRole = "parent";

  // 1. Build Facts (Simplified for now - usually calls insights.service)
  const facts: WriterFacts = {
    scenario: scenarioFromTool(result.tool),
    role,
    language,
    timeframe: timeframeLabel(result.timeframe || "recent", language),
    childName: result.childName,
    metricLines: [], // Build based on result
    riskLevel: riskFromResult(result),
    observationLines: [],
    recommendationLines: []
  };

  if (result.tool === "summarize_attendance") {
    facts.metricLines = [
      language === "fil"
        ? `Attendance: ${result.present}/${result.totalDays} araw (${result.attendanceRate}%)`
        : `Attendance: ${result.present}/${result.totalDays} days (${result.attendanceRate}%)`,
    ];
  } else if (result.tool === "summarize_feeding") {
    facts.metricLines = [
      language === "fil"
        ? `Pagkain: ${result.completed}/${result.totalMeals} meal (${result.feedingRate}%)`
        : `Feeding: ${result.completed}/${result.totalMeals} meals (${result.feedingRate}%)`,
    ];
  } else if (result.tool === "generate_child_report") {
    facts.metricLines = [
      language === "fil"
        ? `Attendance: ${result.attendance.present}/${result.attendance.totalDays} araw (${result.attendance.attendanceRate}%)`
        : `Attendance: ${result.attendance.present}/${result.attendance.totalDays} days (${result.attendance.attendanceRate}%)`,
      language === "fil"
        ? `Pagkain: ${result.feeding.completed}/${result.feeding.totalMeals} meal (${result.feeding.feedingRate}%)`
        : `Feeding: ${result.feeding.completed}/${result.feeding.totalMeals} meals (${result.feeding.feedingRate}%)`,
    ];
  }

  // 2. Determine Policy
  const policy: WriterDisplayPolicy = {
    mode: process.env.AI_WRITER_MODE === "llm" ? "structured" : "direct",
    responseTemplate: facts.riskLevel === "HIGH" ? "alert" : "fact",
    includeSuggestedActions: true,
    // Follow-up state and wording are owned by ai-chat.service so the
    // deterministic and Gemini paths cannot produce duplicate questions.
    includeFollowUp: false,
    includeRiskLevel: true,
    detailMode: "compact"
  };

  // 3. Generate Reply
  let finalReply: string;
  
  if (policy.mode === "structured") {
    try {
      const targetLanguage = language === "fil" ? "Filipino" : "English";
      const prompt = `Generate only valid JSON for a parent about ${facts.scenario}. Write all narrative text in ${targetLanguage}. Preserve proper names, stored food descriptions, dates, counts, and percentages exactly. Common terms such as attendance, feeding, meal, and risk may remain in English in Filipino text. Do not invent facts. Facts: ${JSON.stringify(facts)}`;
      const raw = await askGemini(prompt, { mode: "json" });
      const validated = WriterOutputSchema.parse(JSON.parse(raw)) as WriterStructuredOutput;
      if (clearlyWrongLanguage(validated, language)) {
        throw new Error("Gemini returned the wrong response language.");
      }
      finalReply = renderWriterOutput(validated, facts, policy);
    } catch (e) {
      finalReply = buildDeterministicNarrative(question, facts, policy);
    }
  } else {
    finalReply = buildDeterministicNarrative(question, facts, policy);
  }

  remember(conversationId, { role: "user", content: question });
  remember(conversationId, { role: "assistant", content: finalReply });

  return { reply: finalReply, riskLevel: facts.riskLevel };
}

export async function writeConversationClosure(params: {
  role: string;
  language: AIResponseLanguage;
  message: string;
  conversationId: string;
}): Promise<AIChatReply> {
  const { language, message, conversationId } = params;
  
  const targetLanguage = language === "fil" ? "Filipino" : "English";
  const prompt = `Write one short, polite closing for a parent AI chat in ${targetLanguage}. Do not add facts or questions. User said: "${message}".`;
  let reply: string;
  try {
    reply = (await askGemini(prompt)).trim();
    if (!reply || reply.length > 1000 || clearlyWrongTextLanguage(reply, language)) {
      throw new Error("Gemini returned an unusable closing.");
    }
  } catch {
    reply =
      language === "fil"
        ? "Walang anuman! Maaari kang magtanong anumang oras tungkol sa records ng iyong anak."
        : "You're welcome! Ask me anytime about your child's records.";
  }

  remember(conversationId, { role: "user", content: message });
  remember(conversationId, { role: "assistant", content: reply });
  return { reply };
}

export function buildConversationId(params: {
  requesterId?: string;
  role: string;
  childId?: string;
  language: AIResponseLanguage;
  contextId?: string;
}): string {
  return `${params.requesterId || "anon"}:${params.role}:${params.childId || "global"}:${params.language}:${params.contextId || "legacy"}`;
}

export type { ConversationTurn } from "../../types/generators-ai-writer.types";

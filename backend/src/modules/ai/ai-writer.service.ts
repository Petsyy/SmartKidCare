/**
 * AI Writer Service
 * 
 * Orchestrates: Memory, Fact Building, LLM Generation, and Display Policies.
 */
import { z } from "zod";
import { askGemini } from ".";
import { AIResponseLanguage } from "./ai-chat.service";
import { 
  AIRole, 
  WriterFacts, 
  WriterStructuredOutput, 
  WriterDisplayPolicy,
  renderWriterOutput,
  buildDeterministicNarrative,
  AttendanceComparisonResult,
  FeedingComparisonResult
} from "./ai-writer-render.service";

export { AttendanceComparisonResult, FeedingComparisonResult };

// ─── Memory Management ──────────────────────────────────────────────

export type ConversationTurn = { role: "user" | "assistant"; content: string };
const HISTORY_LIMIT = 8;
const writerMemory = new Map<string, ConversationTurn[]>();

export const getHistory = (id: string) => [...(writerMemory.get(id) ?? [])];
export const getConversationHistory = getHistory;
export const remember = (id: string, turn: ConversationTurn) => {
  const current = writerMemory.get(id) ?? [];
  writerMemory.set(id, [...current, turn].slice(-HISTORY_LIMIT));
};

// ─── Policy & LLM Logic ─────────────────────────────────────────────

const WriterOutputSchema = z.object({
  responseTemplate: z.enum(["fact", "advice", "alert"]),
  headline: z.string(),
  metricLines: z.array(z.string()),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  analysis: z.string(),
  suggestedActions: z.array(z.string()).optional(),
  followUp: z.string().optional(),
});

export async function writeToolNarrative(params: {
  result: any;
  role: string;
  question: string;
  language: AIResponseLanguage;
  conversationId: string;
  suppressFollowUp?: boolean;
}): Promise<string> {
  const { result, question, language, conversationId, suppressFollowUp } = params;
  const role: AIRole = "parent";

  // 1. Build Facts (Simplified for now - usually calls insights.service)
  const facts: WriterFacts = {
    scenario: result.tool.includes("attendance") ? "child_attendance" : "child_feeding",
    role,
    language,
    timeframe: result.timeframe || "recent",
    childName: result.childName,
    metricLines: [], // Build based on result
    riskLevel: result.attendanceRate < 80 ? "HIGH" : "LOW",
    observationLines: [],
    recommendationLines: []
  };

  if (result.tool === "summarize_attendance") {
    facts.metricLines = [`Attendance: ${result.present}/${result.totalDays} days (${result.attendanceRate}%)`];
  } else if (result.tool === "summarize_feeding") {
    facts.metricLines = [`Feeding: ${result.completed}/${result.totalMeals} meals (${result.feedingRate}%)`];
  }

  // 2. Determine Policy
  const policy: WriterDisplayPolicy = {
    mode: process.env.AI_WRITER_MODE === "llm" ? "structured" : "direct",
    responseTemplate: facts.riskLevel === "HIGH" ? "alert" : "fact",
    includeSuggestedActions: true,
    includeFollowUp: !suppressFollowUp,
    includeRiskLevel: true,
    detailMode: "compact"
  };

  // 3. Generate Reply
  let finalReply: string;
  
  if (policy.mode === "structured") {
    try {
      const prompt = `Generate a JSON response for a ${role} about ${facts.scenario}. Facts: ${JSON.stringify(facts)}`;
      const raw = await askGemini(prompt, { mode: "json" });
      const validated = WriterOutputSchema.parse(JSON.parse(raw)) as WriterStructuredOutput;
      finalReply = renderWriterOutput(validated, facts, policy);
    } catch (e) {
      finalReply = buildDeterministicNarrative(question, facts, policy);
    }
  } else {
    finalReply = buildDeterministicNarrative(question, facts, policy);
  }

  remember(conversationId, { role: "user", content: question });
  remember(conversationId, { role: "assistant", content: finalReply });

  return finalReply;
}

export async function writeConversationClosure(params: {
  role: string;
  language: AIResponseLanguage;
  message: string;
  conversationId: string;
}): Promise<string> {
  const { language, message, conversationId } = params;
  
  const prompt = `Write a polite closing for an AI chat. User said: "${message}". Language: ${language}`;
  let reply: string;
  try {
    reply = (await askGemini(prompt)).trim();
  } catch {
    reply = "You're welcome! Ask me anytime about your child's records.";
  }

  remember(conversationId, { role: "user", content: message });
  remember(conversationId, { role: "assistant", content: reply });
  return reply;
}

export function buildConversationId(params: {
  requesterId?: string;
  role: string;
  childId?: string;
  language: AIResponseLanguage;
}): string {
  return `${params.requesterId || "anon"}:${params.role}:${params.childId || "global"}:${params.language}`;
}

import { z } from "zod";
import { askGemini } from "../gemini.service";
import { AIResponseLanguage } from "../language.service";
import { renderWriterOutput } from "./writer.narrative";
import { ConversationTurn } from "./writer.memory";
import { WriterDisplayPolicy } from "./writer.policy";
import {
  AIRole,
  WriterFacts,
  WriterStructuredOutput,
} from "./types";

const WriterOutputSchema = z.object({
  responseTemplate: z.enum(["fact", "advice", "alert"]),
  headline: z.string().min(1),
  metricLines: z.array(z.string().min(1)).min(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  analysis: z.string().min(1),
  suggestedActions: z.array(z.string().min(1)).max(3).optional(),
  followUp: z.string().optional(),
});

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

  return [...valueMatches, ...isoDateMatches, ...namedDateMatches].map((token) =>
    normalizeForGrounding(token),
  );
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

function isGroundedNarrative(params: {
  output: WriterStructuredOutput;
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

function validateWriterOutput(
  output: WriterStructuredOutput,
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
- IMPORTANT: Always address the user as a parent and use "your child" (or "anak mo" in Tagalog) instead of the child's name.
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

export async function tryWriteStructuredNarrativeWithLLM(params: {
  facts: WriterFacts;
  role: AIRole;
  language: AIResponseLanguage;
  question: string;
  history: ConversationTurn[];
  policy: WriterDisplayPolicy;
}): Promise<string | null> {
  const prompt = buildWriterPrompt(params);

  try {
    const raw = await askGemini(prompt, { mode: "json" });
    const parsedUnknown = parseFirstJSONObject(raw);
    const validated = WriterOutputSchema.parse(
      parsedUnknown,
    ) as WriterStructuredOutput;

    if (
      validateWriterOutput(validated, params.facts, params.policy) &&
      isGroundedNarrative({ output: validated, facts: params.facts })
    ) {
      return renderWriterOutput(validated, params.facts, params.policy);
    }
  } catch {
    return null;
  }

  return null;
}

export async function tryWriteConversationClosureWithLLM(params: {
  role: AIRole;
  language: AIResponseLanguage;
  message: string;
  history: ConversationTurn[];
}): Promise<string> {
  const historyText =
    params.history.length === 0
      ? "None"
      : params.history
          .slice(-8)
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join("\n");

  const prompt = `
You are SmartKidCare's assistant.
Write a polite conversation-closing response.

Rules:
- Language: ${params.language === "tl" ? "Filipino/Tagalog" : "English"}.
- Audience role: ${params.role}.
- Keep it to 1-2 concise sentences.
- Thank the user and invite them to ask again anytime about attendance/feeding.
- Plain text only. No markdown/code fences.

Recent conversation memory:
${historyText}

User closing message:
${params.message}
`.trim();

  try {
    return (await askGemini(prompt, { mode: "text" })).trim();
  } catch {
    return "";
  }
}

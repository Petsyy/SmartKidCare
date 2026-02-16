import { z } from "zod";
import { askGemini } from "./gemini.service";
import {
  executeAgentTool,
  renderAgentToolResult,
  AgentToolName,
  AgentToolResult,
} from "./aiTools.service";

type AIRole = "parent" | "teacher" | "admin";

const ToolActionSchema = z.object({
  type: z.literal("tool"),
  tool: z.enum(["count_absences", "count_missed_meals"]),
  args: z
    .object({
      timeframe: z.string().optional(),
    })
    .optional(),
});

const FinalActionSchema = z.object({
  type: z.literal("final"),
  reply: z.string().min(1),
});

const AgentActionSchema = z.discriminatedUnion("type", [
  ToolActionSchema,
  FinalActionSchema,
]);

type AgentAction = z.infer<typeof AgentActionSchema>;

function normalizeRole(role: string): AIRole {
  const normalized = role.toLowerCase();
  if (normalized === "teacher") return "teacher";
  if (normalized === "admin") return "admin";
  return "parent";
}

function shouldTriggerAbsenceAgent(lower: string): boolean {
  const hasAbsenceWord = /\babsences?\b/.test(lower);
  const hasAbsentCountPattern =
    /\babsent\b/.test(lower) &&
    /\b(how many|count|number|total|any|have)\b/.test(lower);
  return hasAbsenceWord || hasAbsentCountPattern;
}

function shouldTriggerMissedMealsAgent(lower: string): boolean {
  const mealDomain = /\b(meals?|feeding|feed|food|eat|ate|eaten)\b/.test(lower);
  const missedIntent =
    /\b(missed|skip|skipped)\b/.test(lower) ||
    lower.includes("didn't eat") ||
    lower.includes("did not eat") ||
    lower.includes("not eat");

  return mealDomain && missedIntent;
}

export function shouldUseAIAgent(question: string): boolean {
  const lower = question.trim().toLowerCase();
  if (!lower) return false;

  return (
    shouldTriggerAbsenceAgent(lower) || shouldTriggerMissedMealsAgent(lower)
  );
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractFirstJsonObject(text: string): string | null {
  const source = stripFences(text);
  const start = source.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      depth += 1;
      continue;
    }

    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseAgentAction(rawText: string): AgentAction | null {
  const direct = stripFences(rawText);
  const candidates = [direct, extractFirstJsonObject(rawText)].filter(
    (item): item is string => Boolean(item),
  );

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const validated = AgentActionSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    } catch {
      // no-op
    }
  }

  return null;
}

function inferSuggestedTool(question: string): AgentToolName {
  const lower = question.toLowerCase();
  if (shouldTriggerMissedMealsAgent(lower)) return "count_missed_meals";
  return "count_absences";
}

function inferSuggestedTimeframe(
  question: string,
): "today" | "week" | "recent" {
  const lower = question.toLowerCase();
  if (lower.includes("today")) return "today";
  if (lower.includes("week")) return "week";
  return "recent";
}

function buildAgentPrompt(params: {
  role: AIRole;
  question: string;
  attendanceSummary: string;
  feedingSummary: string;
  thoughtLog: string[];
  forceFinal: boolean;
}): string {
  const {
    role,
    question,
    attendanceSummary,
    feedingSummary,
    thoughtLog,
    forceFinal,
  } = params;

  const suggestedTool = inferSuggestedTool(question);
  const suggestedTimeframe = inferSuggestedTimeframe(question);
  const toolHistory = thoughtLog.length ? thoughtLog.join("\n") : "None";
  const finalConstraint = forceFinal
    ? "IMPORTANT: You already have tool output. Return type='final' now."
    : "";

  return `
You are the SmartKidCare planning agent.
Return ONLY one valid JSON object with no extra text.

Allowed JSON shapes:
{"type":"tool","tool":"count_absences","args":{"timeframe":"today|week|recent"}}
{"type":"tool","tool":"count_missed_meals","args":{"timeframe":"today|week|recent"}}
{"type":"final","reply":"plain text answer"}

Rules:
- Use only provided attendance/feeding summaries.
- Never invent counts or dates.
- If tool results already exist, produce a final answer.
- Keep final answers short and plain text.
- Do not include markdown, code fences, or numbered lists.

Context:
- Role: ${role}
- Suggested tool: ${suggestedTool}
- Suggested timeframe: ${suggestedTimeframe}

Attendance Summary:
${attendanceSummary}

Feeding Summary:
${feedingSummary}

Question:
${question}

Tool Trace:
${toolHistory}

${finalConstraint}
`;
}

function cleanFinalReply(reply: string): string {
  return reply.replace(/\r\n/g, "\n").trim();
}

export async function tryHandleAgentQuery(params: {
  role: string;
  question: string;
  attendanceSummary: string;
  feedingSummary: string;
}): Promise<string | null> {
  const { role, question, attendanceSummary, feedingSummary } = params;

  if (!shouldUseAIAgent(question)) return null;

  const normalizedRole = normalizeRole(role);
  const thoughtLog: string[] = [];
  let lastToolResult: AgentToolResult | null = null;

  const maxSteps = 3;
  for (let step = 0; step < maxSteps; step += 1) {
    const prompt = buildAgentPrompt({
      role: normalizedRole,
      question,
      attendanceSummary,
      feedingSummary,
      thoughtLog,
      forceFinal: step > 0 && lastToolResult !== null,
    });

    const raw = await askGemini(prompt);
    const action = parseAgentAction(raw);
    if (!action) {
      break;
    }

    if (action.type === "final") {
      if (lastToolResult) {
        // Keep metric replies deterministic and grammatically consistent.
        return renderAgentToolResult(lastToolResult);
      }

      const finalReply = cleanFinalReply(action.reply);
      if (finalReply) {
        // No tool call was made; let deterministic handlers decide wording.
        break;
      }
      break;
    }

    const toolResult = executeAgentTool({
      tool: action.tool,
      timeframe: action.args?.timeframe,
      attendanceSummary,
      feedingSummary,
    });

    lastToolResult = toolResult;
    thoughtLog.push(
      JSON.stringify({
        tool: action.tool,
        timeframe: action.args?.timeframe ?? "recent",
        result: toolResult,
      }),
    );
  }

  if (lastToolResult) {
    return renderAgentToolResult(lastToolResult);
  }

  return null;
}

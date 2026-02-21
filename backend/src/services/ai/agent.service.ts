import { z } from "zod";
import { askGemini } from "./gemini.service";
import {
  executeAgentTool,
  renderAgentToolResult,
  AgentToolName,
  AgentToolResult,
} from "./tools.service";

type AIRole = "parent" | "teacher" | "admin";

const ToolActionSchema = z.object({
  type: z.literal("tool"),
  tool: z.enum([
    "summarize_attendance",
    "summarize_feeding",
    "generate_child_report",
  ]),
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

function shouldTriggerPresenceAgent(lower: string): boolean {
  // e.g., "Was my child present today?", "Is my child present?"
  const mentionsPresent = /\bpresent\b/.test(lower);
  const mentionsAttendance =
    /\battendance\b/.test(lower) || /\bcheck[- ]?in\b/.test(lower);
  const mentionsTimeframe =
    /\btoday\b/.test(lower) ||
    /\bweek\b/.test(lower) ||
    /\brecent\b/.test(lower);

  return (
    mentionsPresent &&
    (mentionsAttendance || mentionsTimeframe || /\bchild\b/.test(lower))
  );
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

function shouldTriggerReportAgent(lower: string): boolean {
  const explicitReportIntent =
    /\b(report|summary|overview|overall|status)\b/.test(lower);
  if (explicitReportIntent) return true;

  const hasChildSubject = /\b(child|children|kid|kids)\b/.test(lower);
  const asksHowDoing =
    /\bhow\b/.test(lower) &&
    /\b(do|doing|progress|performing)\b/.test(lower) &&
    hasChildSubject;
  const hasTimeframe = /\b(today|week|weekly|recent|recently|month)\b/.test(
    lower,
  );

  return asksHowDoing && hasTimeframe;
}

function shouldTriggerFoodIntakeAgent(lower: string): boolean {
  const mealDomain = /\b(meals?|feeding|feed|food|eat|ate|eaten|served)\b/.test(
    lower,
  );
  if (!mealDomain) return false;

  const asksWhatWasEaten =
    /\b(what|which)\b/.test(lower) &&
    /\b(eat|ate|food|meal|served)\b/.test(lower);
  const asksIfChildAte =
    /\b(did|has)\b/.test(lower) &&
    /\bchild\b/.test(lower) &&
    /\b(eat|ate)\b/.test(lower);
  const asksFoodByTime =
    /\b(food|meal)\b/.test(lower) &&
    /\b(today|week|recent|recently)\b/.test(lower);

  return asksWhatWasEaten || asksIfChildAte || asksFoodByTime;
}

export function detectToolForQuestion(question: string): AgentToolName | null {
  const lower = question.trim().toLowerCase();
  const hasChildSubject = /\b(child|children|kid|kids)\b/.test(lower);

  const hasAttendanceSignal =
    /\b(attendance|attend|present|absent|check[- ]?in|in school|came to school)\b/.test(
      lower,
    ) ||
    shouldTriggerAbsenceAgent(lower) ||
    shouldTriggerPresenceAgent(lower);

  const hasFeedingSignal =
    /\b(feeding|feed|food|meal|meals|eat|ate|eaten|served|lunch|snack|breakfast|dinner)\b/.test(
      lower,
    ) ||
    shouldTriggerMissedMealsAgent(lower) ||
    shouldTriggerFoodIntakeAgent(lower);

  const wantsReport =
    shouldTriggerReportAgent(lower) ||
    /\b(how is|how are|overall|status|progress)\b/.test(lower);

  // Highest priority: explicit single-domain intent should stay single-domain.
  if (hasAttendanceSignal && !hasFeedingSignal) return "summarize_attendance";
  if (hasFeedingSignal && !hasAttendanceSignal) return "summarize_feeding";

  // If both domains are present, return combined report.
  if (hasAttendanceSignal && hasFeedingSignal) return "generate_child_report";

  // Generic child status/report query with no explicit domain.
  if (wantsReport && hasChildSubject) return "generate_child_report";

  return null;
}

export function shouldUseAIAgent(question: string): boolean {
  return detectToolForQuestion(question) !== null;
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
  return detectToolForQuestion(question) ?? "generate_child_report";
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
  thoughtLog: string[];
  forceFinal: boolean;
}): string {
  const { role, question, thoughtLog, forceFinal } = params;

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
{"type":"tool","tool":"summarize_attendance","args":{"timeframe":"today|week|recent"}}
{"type":"tool","tool":"summarize_feeding","args":{"timeframe":"today|week|recent"}}
{"type":"tool","tool":"generate_child_report","args":{"timeframe":"today|week|recent"}}
{"type":"final","reply":"plain text answer"}

Rules:
- Use only provided attendance/feeding summaries.
- Never invent counts or dates.
- Use summarize_attendance for attendance questions.
- Use summarize_feeding for feeding/meal questions.
- Use generate_child_report for combined overview/report questions.
- If tool results already exist, produce a final answer.
- Keep final answers short and plain text.
- Do not include markdown, code fences, or numbered lists.

Context:
- Role: ${role}
- Suggested tool: ${suggestedTool}
- Suggested timeframe: ${suggestedTimeframe}
- Question: ${question}
- Tool Trace: ${toolHistory}

${finalConstraint}`;
}

function cleanFinalReply(reply: string): string {
  return reply.replace(/\r\n/g, "\n").trim();
}

export async function tryHandleAgentQuery(params: {
  role: string;
  question: string;
  childId: string;
}): Promise<string | null> {
  const { role, question, childId } = params;

  if (!shouldUseAIAgent(question)) return null;

  // Fast path: route feeding/attendance intent directly to deterministic Mongo-backed tools.
  const directTool = detectToolForQuestion(question);
  if (directTool) {
    const directTimeframe = inferSuggestedTimeframe(question);
    const directResult = await executeAgentTool({
      tool: directTool,
      timeframe: directTimeframe,
      childId,
    });
    return renderAgentToolResult(directResult);
  }

  const normalizedRole = normalizeRole(role);
  const thoughtLog: string[] = [];
  let lastToolResult: AgentToolResult | null = null;

  const maxSteps = 3;
  for (let step = 0; step < maxSteps; step += 1) {
    const prompt = buildAgentPrompt({
      role: normalizedRole,
      question,
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

    const toolResult = await executeAgentTool({
      tool: action.tool,
      timeframe: action.args?.timeframe,
      childId,
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

  const fallbackTool = inferSuggestedTool(question);
  const fallbackTimeframe = inferSuggestedTimeframe(question);
  const fallbackResult = await executeAgentTool({
    tool: fallbackTool,
    timeframe: fallbackTimeframe,
    childId,
  });

  return renderAgentToolResult(fallbackResult);
}

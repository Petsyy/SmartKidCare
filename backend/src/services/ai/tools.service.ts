import {
  summarizeAttendanceTool as summarizeAttendanceMongo,
  summarizeFeedingTool as summarizeFeedingMongo,
  generateChildReportTool as generateChildReportMongo,
  ToolTimeframe,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
  GenerateChildReportResult,
} from "./agent-tools.service";

export type AgentToolTimeframe = ToolTimeframe;
export type AgentToolName =
  | "summarize_attendance"
  | "summarize_feeding"
  | "generate_child_report";

export type AgentToolResult =
  | SummarizeAttendanceResult
  | SummarizeFeedingResult
  | GenerateChildReportResult;

function normalizeTimeframe(value?: string): AgentToolTimeframe {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized.includes("last_week")) return "last_week";
  if (normalized.includes("last week")) return "last_week";
  if (normalized.includes("previous week")) return "last_week";
  if (normalized.includes("nakaraang linggo")) return "last_week";
  if (normalized.includes("huling linggo")) return "last_week";
  if (normalized.includes("today")) return "today";
  if (normalized.includes("month")) return "month";
  if (normalized.includes("buwan")) return "month";
  if (normalized.includes("week")) return "week";
  return "recent";
}

export async function executeAgentTool(params: {
  tool: AgentToolName;
  timeframe?: string;
  childId: string;
}): Promise<AgentToolResult> {
  const { tool, timeframe, childId } = params;
  const safeTimeframe = normalizeTimeframe(timeframe);

  if (tool === "summarize_attendance") {
    return summarizeAttendanceMongo(childId, safeTimeframe);
  }

  if (tool === "summarize_feeding") {
    return summarizeFeedingMongo(childId, safeTimeframe);
  }

  return generateChildReportMongo(childId, safeTimeframe);
}

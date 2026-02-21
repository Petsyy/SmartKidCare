import {
  summarizeAttendanceTool as summarizeAttendanceMongo,
  summarizeFeedingTool as summarizeFeedingMongo,
  generateChildReportTool as generateChildReportMongo,
  ToolTimeframe,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
  GenerateChildReportResult,
} from "./mongoAgentTools.service";
import {
  composeAttendanceReply,
  composeChildReportReply,
  composeFeedingReply,
} from "./nlg.service";

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
  if (normalized.includes("today")) return "today";
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

export function renderAgentToolResult(result: AgentToolResult): string {
  if (result.tool === "summarize_attendance") {
    return composeAttendanceReply(result);
  }

  if (result.tool === "summarize_feeding") {
    return composeFeedingReply(result);
  }

  return composeChildReportReply(result);
}

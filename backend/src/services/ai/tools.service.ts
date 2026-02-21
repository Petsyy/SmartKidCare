import {
  summarizeAttendanceTool as summarizeAttendanceMongo,
  summarizeFeedingTool as summarizeFeedingMongo,
  generateChildReportTool as generateChildReportMongo,
  ToolTimeframe,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
  GenerateChildReportResult,
} from "./mongoAgentTools.service";

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
    const {
      present,
      absent,
      attendanceRate,
      totalDays,
      absentDates,
      timeframe,
    } = result;

    // For "today" queries, return a direct present/absent answer.
    if (timeframe === "today" && totalDays > 0) {
      if (absent > 0) return "Your child was absent today.";
      return "Yes, your child was present today.";
    }

    const lines = [
      `Attendance: ${present} present, ${absent} absent out of ${totalDays} days.`,
      `Attendance rate: ${attendanceRate}%`,
    ];
    if (absentDates.length) {
      lines.push(`Absent dates: ${absentDates.join(", ")}`);
    }
    return lines.join("\n");
  }

  if (result.tool === "summarize_feeding") {
    const { completed, missed, totalMeals, feedingRate, foods } = result;
    const foodsText = foods.length ? `Foods: ${foods.join(", ")}.` : "";
    return [
      `Feeding: ${completed} completed, ${missed} missed out of ${totalMeals} meals.`,
      `Feeding rate: ${feedingRate}%`,
      foodsText,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const attendanceText = renderAgentToolResult(result.attendance);
  const feedingText = renderAgentToolResult(result.feeding);
  return [`Report for ${result.timeframe}:`, attendanceText, feedingText]
    .filter(Boolean)
    .join("\n");
}

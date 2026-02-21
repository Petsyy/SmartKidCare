import {
  GenerateChildReportResult,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
} from "./mongoAgentTools.service";
import {
  ChildReportInsight,
  InsightBlock,
  analyzeAttendanceInsight,
  analyzeFeedingInsight,
} from "./insights.service";

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

export function recommendForAttendance(
  result: SummarizeAttendanceResult,
  insight?: InsightBlock,
): string[] {
  const evaluated = insight ?? analyzeAttendanceInsight(result);
  const notes: string[] = [];

  if (result.totalDays === 0) {
    return ["Try recording attendance daily so we can generate reliable insights."];
  }

  if (evaluated.riskFlags.includes("low_attendance_rate")) {
    notes.push(
      "Review morning routines and possible barriers that may affect attendance.",
    );
  }
  if (evaluated.riskFlags.includes("repeated_absence")) {
    notes.push("Track absence patterns and follow up on repeated absence days.");
  }

  if (!notes.length && result.attendanceRate >= 95) {
    notes.push("Excellent attendance performance. Overall, attendance is stable and well maintained.");
  } else if (!notes.length && result.attendanceRate >= 85) {
    notes.push("Overall, attendance remains strong and well maintained.");
  } else if (!notes.length && result.attendanceRate < 80) {
    notes.push("Attendance may need closer monitoring in the coming days.");
  } else if (!notes.length) {
    notes.push("Continue encouraging consistent attendance this week.");
  }

  return unique(notes);
}

export function recommendForFeeding(
  result: SummarizeFeedingResult,
  insight?: InsightBlock,
): string[] {
  const evaluated = insight ?? analyzeFeedingInsight(result);
  const notes: string[] = [];

  if (result.totalMeals === 0) {
    return ["Try recording feeding status daily so we can generate reliable insights."];
  }

  if (evaluated.riskFlags.includes("low_feeding_rate")) {
    notes.push(
      "Monitor meal completion closely and coordinate with the teacher on missed meals.",
    );
  }
  if (evaluated.riskFlags.includes("repeated_missed_meals")) {
    notes.push("Review recurring missed-meal days for possible appetite patterns.");
  }
  if (result.totalMeals >= 5 && result.foods.length <= 2) {
    notes.push("Consider adding more meal variety across the week.");
  }

  if (!notes.length && result.feedingRate >= 95) {
    notes.push("Excellent feeding consistency. Overall, feeding habits are stable and well maintained.");
  } else if (!notes.length && result.feedingRate >= 85) {
    notes.push("Overall, feeding consistency remains strong.");
  } else if (!notes.length && result.feedingRate < 80) {
    notes.push("Feeding consistency may need closer monitoring in the coming days.");
  } else if (!notes.length) {
    notes.push("Continue supporting consistent feeding this week.");
  }

  return unique(notes);
}

export function recommendForChildReport(
  result: GenerateChildReportResult,
  insight: ChildReportInsight,
): string[] {
  return unique([
    ...recommendForAttendance(result.attendance, insight.attendance),
    ...recommendForFeeding(result.feeding, insight.feeding),
  ]);
}

import {
  GenerateChildReportResult,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
} from "./mongoAgentTools.service";
import {
  ChildReportInsight,
  InsightBlock,
  analyzeAttendanceInsight,
  analyzeChildReportInsight,
  analyzeFeedingInsight,
} from "./insights.service";
import {
  recommendForAttendance,
  recommendForChildReport,
  recommendForFeeding,
} from "./recommendations.service";

function timeframeLabel(timeframe: "today" | "week" | "recent"): string {
  if (timeframe === "today") return "today";
  if (timeframe === "week") return "this week";
  return "recently";
}

function formatAbsentDatesSentence(absentDates: string[]): string {
  if (!absentDates.length) return "";
  if (absentDates.length === 1) {
    return `The absence was on ${absentDates[0]}.`;
  }
  return `Absences were recorded on ${absentDates.join(", ")}.`;
}

function topRecommendationSentence(recommendations: string[]): string {
  if (!recommendations.length) return "";
  return recommendations[0];
}

function attendanceRateSentence(
  rate: number,
  level: InsightBlock["level"],
): string {
  if (level === "excellent") {
    return `Attendance is excellent at ${rate}%, with very consistent participation.`;
  }
  if (level === "good") {
    return `Attendance remains strong at ${rate}%, showing consistent participation.`;
  }
  if (level === "watch") {
    return `Attendance is ${rate}%, and may need closer monitoring.`;
  }
  return `Attendance is ${rate}%, and needs immediate attention.`;
}

function feedingRateSentence(
  rate: number,
  level: InsightBlock["level"],
): string {
  if (level === "excellent") {
    return `Feeding consistency is excellent at ${rate}%.`;
  }
  if (level === "good") {
    return `Feeding consistency remains strong at ${rate}%.`;
  }
  if (level === "watch") {
    return `Feeding consistency is ${rate}%, and may need closer monitoring.`;
  }
  return `Feeding consistency is ${rate}%, and needs immediate attention.`;
}

function overallSentence(level: ChildReportInsight["overallLevel"]): string {
  if (level === "excellent") {
    return "Overall performance is excellent this period.";
  }
  if (level === "good") {
    return "Overall performance is good with minor areas to monitor.";
  }
  if (level === "watch") {
    return "Overall performance is moderate and should be monitored.";
  }
  return "Overall performance needs attention right now.";
}

export function composeAttendanceReply(
  result: SummarizeAttendanceResult,
  insight: InsightBlock = analyzeAttendanceInsight(result),
): string {
  const recommendations = recommendForAttendance(result, insight);
  const rangeText = timeframeLabel(result.timeframe);

  if (result.timeframe === "today" && result.totalDays > 0) {
    const statusText =
      result.absent > 0
        ? "Your child was absent today."
        : "Yes, your child was present today.";
    return [
      statusText,
      attendanceRateSentence(result.attendanceRate, insight.level),
      topRecommendationSentence(recommendations),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (result.totalDays === 0) {
    return [insight.interpretation, topRecommendationSentence(recommendations)]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Your child attended ${result.present} out of ${result.totalDays} school days ${rangeText}, with ${result.absent} absence${result.absent === 1 ? "" : "s"}.`,
    attendanceRateSentence(result.attendanceRate, insight.level),
    formatAbsentDatesSentence(result.absentDates),
    topRecommendationSentence(recommendations),
  ]
    .filter(Boolean)
    .join("\n");
}

export function composeFeedingReply(
  result: SummarizeFeedingResult,
  insight: InsightBlock = analyzeFeedingInsight(result),
): string {
  const recommendations = recommendForFeeding(result, insight);
  const rangeText = timeframeLabel(result.timeframe);
  const foodsText = result.foods.length
    ? `Meals served included ${result.foods.join(", ")}.`
    : "";

  if (result.totalMeals === 0) {
    return [insight.interpretation, topRecommendationSentence(recommendations)]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Your child completed ${result.completed} out of ${result.totalMeals} meals ${rangeText}, with ${result.missed} missed.`,
    feedingRateSentence(result.feedingRate, insight.level),
    foodsText,
    topRecommendationSentence(recommendations),
  ]
    .filter(Boolean)
    .join("\n");
}

export function composeChildReportReply(
  result: GenerateChildReportResult,
  insight: ChildReportInsight = analyzeChildReportInsight(result),
): string {
  const recommendations = recommendForChildReport(result, insight);
  const rangeText = timeframeLabel(result.timeframe);

  return [
    `Here is your child's update ${rangeText}.`,
    `Attendance: ${result.attendance.present}/${result.attendance.totalDays} days present (${result.attendance.attendanceRate}%).`,
    `Feeding: ${result.feeding.completed}/${result.feeding.totalMeals} meals completed (${result.feeding.feedingRate}%).`,
    overallSentence(insight.overallLevel),
    formatAbsentDatesSentence(result.attendance.absentDates),
    result.feeding.foods.length
      ? `Meals served included ${result.feeding.foods.join(", ")}.`
      : "",
    topRecommendationSentence(recommendations),
  ]
    .filter(Boolean)
    .join("\n");
}

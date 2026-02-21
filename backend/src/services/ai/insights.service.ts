import {
  GenerateChildReportResult,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
} from "./mongoAgentTools.service";

export type InsightLevel = "excellent" | "good" | "watch" | "critical";

export type InsightBlock = {
  level: InsightLevel;
  interpretation: string;
  riskFlags: string[];
};

export type ChildReportInsight = {
  attendance: InsightBlock;
  feeding: InsightBlock;
  overallLevel: InsightLevel;
};

function minLevel(a: InsightLevel, b: InsightLevel): InsightLevel {
  const rank: Record<InsightLevel, number> = {
    excellent: 4,
    good: 3,
    watch: 2,
    critical: 1,
  };
  return rank[a] <= rank[b] ? a : b;
}

export function analyzeAttendanceInsight(
  result: SummarizeAttendanceResult,
): InsightBlock {
  const { totalDays, attendanceRate, absent } = result;
  const riskFlags: string[] = [];

  if (totalDays === 0) {
    return {
      level: "watch",
      interpretation:
        "No attendance records are available for this timeframe yet.",
      riskFlags: ["no_attendance_data"],
    };
  }

  if (absent >= 2) riskFlags.push("repeated_absence");
  if (attendanceRate < 80) riskFlags.push("low_attendance_rate");

  if (attendanceRate >= 95) {
    return {
      level: "excellent",
      interpretation: "Attendance is very consistent.",
      riskFlags,
    };
  }
  if (attendanceRate >= 85) {
    return {
      level: "good",
      interpretation: "Attendance is good, with minor absences.",
      riskFlags,
    };
  }
  if (attendanceRate >= 70) {
    return {
      level: "watch",
      interpretation: "Attendance is moderate and should be monitored closely.",
      riskFlags,
    };
  }
  return {
    level: "critical",
    interpretation: "Attendance is low and needs immediate follow-up.",
    riskFlags,
  };
}

export function analyzeFeedingInsight(
  result: SummarizeFeedingResult,
): InsightBlock {
  const { totalMeals, feedingRate, missed } = result;
  const riskFlags: string[] = [];

  if (totalMeals === 0) {
    return {
      level: "watch",
      interpretation:
        "No feeding records are available for this timeframe yet.",
      riskFlags: ["no_feeding_data"],
    };
  }

  if (missed >= 2) riskFlags.push("repeated_missed_meals");
  if (feedingRate < 85) riskFlags.push("low_feeding_rate");

  if (feedingRate >= 95) {
    return {
      level: "excellent",
      interpretation: "Meal completion is very consistent.",
      riskFlags,
    };
  }
  if (feedingRate >= 85) {
    return {
      level: "good",
      interpretation: "Feeding consistency is good overall.",
      riskFlags,
    };
  }
  if (feedingRate >= 70) {
    return {
      level: "watch",
      interpretation: "Feeding consistency needs monitoring.",
      riskFlags,
    };
  }
  return {
    level: "critical",
    interpretation: "Feeding consistency is low and needs immediate attention.",
    riskFlags,
  };
}

export function analyzeChildReportInsight(
  result: GenerateChildReportResult,
): ChildReportInsight {
  const attendance = analyzeAttendanceInsight(result.attendance);
  const feeding = analyzeFeedingInsight(result.feeding);
  const overallLevel = minLevel(attendance.level, feeding.level);

  return {
    attendance,
    feeding,
    overallLevel,
  };
}


import { AIResponseLanguage } from "../language.service";
import {
  analyzeAttendanceInsight,
  analyzeChildReportInsight,
  analyzeFeedingInsight,
  InsightBlock,
  InsightLevel,
} from "../insights.service";
import {
  recommendForAttendance,
  recommendForChildReport,
  recommendForFeeding,
} from "../recommendations.service";
import {
  AIRole,
  AttendanceComparisonResult,
  ClassReportResult,
  FeedingComparisonResult,
  WriterFacts,
  WriterRiskLevel,
  WriterSupportedResult,
} from "./types";

function metricLabel(
  key: "attendance" | "feeding" | "childrenIncluded",
  language: AIResponseLanguage,
): string {
  if (language === "tl") {
    if (key === "attendance") return "Attendance";
    if (key === "feeding") return "Feeding Completion";
    return "Mga Batang Kasama";
  }

  if (key === "attendance") return "Attendance";
  if (key === "feeding") return "Feeding Completion";
  return "Children Included";
}

function riskFromInsight(level: InsightLevel): WriterRiskLevel {
  if (level === "critical") return "HIGH";
  if (level === "watch") return "MEDIUM";
  return "LOW";
}

function riskFromRate(rate: number): WriterRiskLevel {
  if (rate < 80) return "HIGH";
  if (rate < 90) return "MEDIUM";
  return "LOW";
}

function formatAbsentDatesLine(
  absentDates: string[],
  language: AIResponseLanguage,
): string | undefined {
  if (!absentDates.length) return undefined;
  if (language === "tl") {
    if (absentDates.length === 1) return `Pagliban: ${absentDates[0]}.`;
    return `Mga araw ng pagliban: ${absentDates.join(", ")}.`;
  }
  if (absentDates.length === 1) return `Absence date: ${absentDates[0]}.`;
  return `Absence dates: ${absentDates.join(", ")}.`;
}

function formatFoodsLine(
  foods: string[],
  language: AIResponseLanguage,
): string | undefined {
  if (!foods.length) return undefined;
  return language === "tl"
    ? `Mga inihain na pagkain: ${foods.join(", ")}.`
    : `Meals served: ${foods.join(", ")}.`;
}

function classAttendanceActions(
  insight: InsightBlock,
  language: AIResponseLanguage,
): string[] {
  if (language === "tl") {
    if (insight.level === "critical") {
      return [
        "I-monitor nang mas malapitan ang attendance ngayong linggo.",
        "Suriin ang posibleng health o schedule issues.",
        "Makipag-coordinate sa mga magulang kung magpapatuloy ang absences.",
      ];
    }
    if (insight.level === "watch") {
      return [
        "I-review ang attendance trend kada araw.",
        "Mag-set ng mabilis na follow-up para sa mga absent entries.",
      ];
    }
    return [
      "Panatilihin ang kasalukuyang attendance routine.",
      "Ikumpara muli sa susunod na linggo para sa trend checking.",
    ];
  }

  if (insight.level === "critical") {
    return [
      "Monitor class attendance closely this week.",
      "Check for health or schedule barriers.",
      "Coordinate with parents if absences continue.",
    ];
  }
  if (insight.level === "watch") {
    return [
      "Review class attendance trend by date.",
      "Set quick follow-ups for absent entries.",
    ];
  }
  return [
    "Maintain the current attendance routine.",
    "Compare again next week to track trend stability.",
  ];
}

function classFeedingActions(
  insight: InsightBlock,
  language: AIResponseLanguage,
): string[] {
  if (language === "tl") {
    if (insight.level === "critical") {
      return [
        "I-monitor nang mas malapitan ang meal completion ngayong linggo.",
        "Suriin ang pattern ng missed meals.",
        "Makipag-coordinate sa mga magulang tungkol sa feeding concerns.",
      ];
    }
    if (insight.level === "watch") {
      return [
        "I-review ang meal history kada araw.",
        "Mag-set ng follow-up sa paulit-ulit na missed meals.",
      ];
    }
    return [
      "Panatilihin ang kasalukuyang feeding routine.",
      "Dagdagan ang meal variety kung posible.",
    ];
  }

  if (insight.level === "critical") {
    return [
      "Monitor class meal completion closely this week.",
      "Review missed meal patterns.",
      "Coordinate with parents about ongoing feeding concerns.",
    ];
  }
  if (insight.level === "watch") {
    return [
      "Review class meal history by date.",
      "Set follow-ups for repeated missed meals.",
    ];
  }
  return [
    "Maintain the current feeding routine.",
    "Add more meal variety where possible.",
  ];
}

function trendActions(
  risk: WriterRiskLevel,
  language: AIResponseLanguage,
): string[] {
  if (language === "tl") {
    if (risk === "HIGH") {
      return [
        "I-review ang daily routine para mabawasan ang absences at missed meals.",
        "Makipag-coordinate sa teacher para sa regular follow-up ngayong linggo.",
      ];
    }
    if (risk === "MEDIUM") {
      return [
        "I-track ang weekly trend para makita kung consistent ang improvement.",
        "Panatilihin ang routines sa attendance at feeding.",
      ];
    }
    return [
      "Panatilihin ang kasalukuyang routines para manatiling stable ang trend.",
      "I-check muli ang trend sa susunod na linggo.",
    ];
  }

  if (risk === "HIGH") {
    return [
      "Review daily routines to reduce absences and missed meals.",
      "Coordinate with the teacher for close weekly follow-up.",
    ];
  }
  if (risk === "MEDIUM") {
    return [
      "Track weekly trend changes to confirm steady improvement.",
      "Maintain consistent attendance and feeding routines.",
    ];
  }
  return [
    "Maintain the current routines to keep trend stability.",
    "Check trend again next week for consistency.",
  ];
}

function buildFactsFromClassAttendance(
  result: Extract<
    WriterSupportedResult,
    { tool: "summarize_attendance_class" }
  >,
  role: AIRole,
  language: AIResponseLanguage,
): WriterFacts {
  const insight = analyzeAttendanceInsight({
    tool: "summarize_attendance",
    timeframe: result.timeframe,
    present: result.present,
    absent: result.absent,
    totalDays: result.totalRecords,
    attendanceRate: result.attendanceRate,
    absentDates: result.absentDates,
  });

  return {
    scenario: "class_attendance",
    role,
    language,
    timeframe: result.timeframe,
    metricLines: [
      `${metricLabel("attendance", language)}: ${result.present}/${result.totalRecords} records (${result.attendanceRate}%)`,
      `${metricLabel("childrenIncluded", language)}: ${result.totalChildren}`,
    ],
    riskLevel: riskFromInsight(insight.level),
    observationLines: [
      insight.interpretation,
      formatAbsentDatesLine(result.absentDates, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines: classAttendanceActions(insight, language),
  };
}

function buildFactsFromClassFeeding(
  result: Extract<WriterSupportedResult, { tool: "summarize_feeding_class" }>,
  role: AIRole,
  language: AIResponseLanguage,
): WriterFacts {
  const insight = analyzeFeedingInsight({
    tool: "summarize_feeding",
    timeframe: result.timeframe,
    completed: result.completed,
    missed: result.missed,
    totalMeals: result.totalRecords,
    feedingRate: result.feedingRate,
    foods: result.foods,
  });

  return {
    scenario: "class_feeding",
    role,
    language,
    timeframe: result.timeframe,
    metricLines: [
      `${metricLabel("feeding", language)}: ${result.completed}/${result.totalRecords} records (${result.feedingRate}%)`,
      `${metricLabel("childrenIncluded", language)}: ${result.totalChildren}`,
    ],
    riskLevel: riskFromInsight(insight.level),
    observationLines: [
      insight.interpretation,
      formatFoodsLine(result.foods, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines: classFeedingActions(insight, language),
  };
}

function buildFactsFromClassReport(
  result: ClassReportResult,
  role: AIRole,
  language: AIResponseLanguage,
): WriterFacts {
  const attendanceFacts = buildFactsFromClassAttendance(
    result.attendance,
    role,
    language,
  );
  const feedingFacts = buildFactsFromClassFeeding(
    result.feeding,
    role,
    language,
  );

  const overallRisk: WriterRiskLevel =
    attendanceFacts.riskLevel === "HIGH" || feedingFacts.riskLevel === "HIGH"
      ? "HIGH"
      : attendanceFacts.riskLevel === "MEDIUM" ||
          feedingFacts.riskLevel === "MEDIUM"
        ? "MEDIUM"
        : "LOW";

  return {
    scenario: "class_report",
    role,
    language,
    timeframe: result.timeframe,
    metricLines: [
      attendanceFacts.metricLines[0],
      feedingFacts.metricLines[0],
      `${metricLabel("childrenIncluded", language)}: ${Math.max(
        result.attendance.totalChildren,
        result.feeding.totalChildren,
      )}`,
    ],
    riskLevel: overallRisk,
    observationLines: [
      ...attendanceFacts.observationLines,
      ...feedingFacts.observationLines,
    ].filter((line): line is string => Boolean(line)),
    recommendationLines: [
      ...attendanceFacts.recommendationLines,
      ...feedingFacts.recommendationLines,
    ].slice(0, 3),
  };
}

async function buildFactsFromAttendanceComparison(
  result: AttendanceComparisonResult,
  role: AIRole,
  language: AIResponseLanguage,
): Promise<WriterFacts> {
  const currentInsight = analyzeAttendanceInsight(result.currentWeek);
  const recommendationLines = await recommendForAttendance(
    result.currentWeek,
    currentInsight,
    language,
    {
      deterministic: true,
    },
  );

  return {
    scenario: "child_attendance_comparison",
    role,
    language,
    timeframe: result.timeframe,
    childName:
      result.childName ??
      result.currentWeek.childName ??
      result.lastWeek.childName,
    metricLines: [
      `${metricLabel("attendance", language)} This Week: ${result.currentWeek.present}/${result.currentWeek.totalDays} days (${result.currentWeek.attendanceRate}%)`,
      `${metricLabel("attendance", language)} Last Week: ${result.lastWeek.present}/${result.lastWeek.totalDays} days (${result.lastWeek.attendanceRate}%)`,
      language === "tl"
        ? `Pagbabago: ${result.deltaRate > 0 ? "+" : ""}${result.deltaRate}%`
        : `Change: ${result.deltaRate > 0 ? "+" : ""}${result.deltaRate}%`,
    ],
    riskLevel: riskFromInsight(currentInsight.level),
    observationLines: [
      currentInsight.interpretation,
      language === "tl"
        ? result.deltaRate > 0
          ? `May pagbuti na ${result.deltaRate}% kumpara sa nakaraang linggo.`
          : result.deltaRate < 0
            ? `May pagbaba na ${Math.abs(result.deltaRate)}% kumpara sa nakaraang linggo.`
            : "Walang pagbabago kumpara sa nakaraang linggo."
        : result.deltaRate > 0
          ? `Attendance improved by ${result.deltaRate}% versus last week.`
          : result.deltaRate < 0
            ? `Attendance declined by ${Math.abs(result.deltaRate)}% versus last week.`
            : "Attendance is unchanged versus last week.",
      formatAbsentDatesLine(result.currentWeek.absentDates, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines,
  };
}

async function buildFactsFromFeedingComparison(
  result: FeedingComparisonResult,
  role: AIRole,
  language: AIResponseLanguage,
): Promise<WriterFacts> {
  const currentInsight = analyzeFeedingInsight(result.currentWeek);
  const recommendationLines = await recommendForFeeding(
    result.currentWeek,
    currentInsight,
    language,
    {
      deterministic: true,
    },
  );

  return {
    scenario: "child_feeding_comparison",
    role,
    language,
    timeframe: result.timeframe,
    childName:
      result.childName ??
      result.currentWeek.childName ??
      result.lastWeek.childName,
    metricLines: [
      `${metricLabel("feeding", language)} This Week: ${result.currentWeek.completed}/${result.currentWeek.totalMeals} meals (${result.currentWeek.feedingRate}%)`,
      `${metricLabel("feeding", language)} Last Week: ${result.lastWeek.completed}/${result.lastWeek.totalMeals} meals (${result.lastWeek.feedingRate}%)`,
      language === "tl"
        ? `Pagbabago: ${result.deltaRate > 0 ? "+" : ""}${result.deltaRate}%`
        : `Change: ${result.deltaRate > 0 ? "+" : ""}${result.deltaRate}%`,
    ],
    riskLevel: riskFromInsight(currentInsight.level),
    observationLines: [
      currentInsight.interpretation,
      language === "tl"
        ? result.deltaRate > 0
          ? `May pagbuti na ${result.deltaRate}% kumpara sa nakaraang linggo.`
          : result.deltaRate < 0
            ? `May pagbaba na ${Math.abs(result.deltaRate)}% kumpara sa nakaraang linggo.`
            : "Walang pagbabago kumpara sa nakaraang linggo."
        : result.deltaRate > 0
          ? `Feeding improved by ${result.deltaRate}% versus last week.`
          : result.deltaRate < 0
            ? `Feeding declined by ${Math.abs(result.deltaRate)}% versus last week.`
            : "Feeding is unchanged versus last week.",
      formatFoodsLine(result.currentWeek.foods, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines,
  };
}

function buildFactsFromChildTrend(
  result: Extract<WriterSupportedResult, { tool: "summarize_child_trend" }>,
  role: AIRole,
  language: AIResponseLanguage,
): WriterFacts {
  const combinedRate = Number(
    ((result.attendanceRate + result.feedingRate) / 2).toFixed(2),
  );
  const riskLevel = riskFromRate(combinedRate);

  const trendLines = result.points.map((point) =>
    language === "tl"
      ? `${point.periodStart}: attendance ${point.attendanceRate}%, feeding ${point.feedingRate}%`
      : `${point.periodStart}: attendance ${point.attendanceRate}%, feeding ${point.feedingRate}%`,
  );

  return {
    scenario: "child_trend",
    role,
    language,
    timeframe: "recent",
    childName: result.childName,
    metricLines: [
      `${metricLabel("attendance", language)}: ${result.attendanceTotal} records (${result.attendanceRate}%)`,
      `${metricLabel("feeding", language)}: ${result.feedingTotal} records (${result.feedingRate}%)`,
    ],
    riskLevel,
    observationLines: [
      language === "tl"
        ? "Trend snapshot sa nakaraang 30 araw:"
        : "Trend snapshot for the last 30 days:",
      ...trendLines,
    ],
    recommendationLines: trendActions(riskLevel, language),
  };
}

async function buildFactsFromChildAttendance(
  result: Extract<WriterSupportedResult, { tool: "summarize_attendance" }>,
  role: AIRole,
  language: AIResponseLanguage,
): Promise<WriterFacts> {
  const insight = analyzeAttendanceInsight(result);
  const recommendationLines = await recommendForAttendance(
    result,
    insight,
    language,
    {
      deterministic: true,
    },
  );

  return {
    scenario: "child_attendance",
    role,
    language,
    timeframe: result.timeframe,
    childName: result.childName,
    metricLines: [
      `${metricLabel("attendance", language)}: ${result.present}/${result.totalDays} days (${result.attendanceRate}%)`,
    ],
    riskLevel: riskFromInsight(insight.level),
    observationLines: [
      insight.interpretation,
      formatAbsentDatesLine(result.absentDates, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines,
  };
}

async function buildFactsFromChildFeeding(
  result: Extract<WriterSupportedResult, { tool: "summarize_feeding" }>,
  role: AIRole,
  language: AIResponseLanguage,
): Promise<WriterFacts> {
  const insight = analyzeFeedingInsight(result);
  const recommendationLines = await recommendForFeeding(
    result,
    insight,
    language,
    {
      deterministic: true,
    },
  );

  return {
    scenario: "child_feeding",
    role,
    language,
    timeframe: result.timeframe,
    childName: result.childName,
    metricLines: [
      `${metricLabel("feeding", language)}: ${result.completed}/${result.totalMeals} meals (${result.feedingRate}%)`,
    ],
    riskLevel: riskFromInsight(insight.level),
    observationLines: [
      insight.interpretation,
      formatFoodsLine(result.foods, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines,
  };
}

async function buildFactsFromChildReport(
  result: Extract<WriterSupportedResult, { tool: "generate_child_report" }>,
  role: AIRole,
  language: AIResponseLanguage,
): Promise<WriterFacts> {
  const insight = analyzeChildReportInsight(result);
  const recommendationLines = await recommendForChildReport(
    result,
    insight,
    language,
    {
      deterministic: true,
    },
  );

  return {
    scenario: "child_report",
    role,
    language,
    timeframe: result.timeframe,
    childName:
      result.childName ??
      result.attendance.childName ??
      result.feeding.childName,
    metricLines: [
      `${metricLabel("attendance", language)}: ${result.attendance.present}/${result.attendance.totalDays} days (${result.attendance.attendanceRate}%)`,
      `${metricLabel("feeding", language)}: ${result.feeding.completed}/${result.feeding.totalMeals} meals (${result.feeding.feedingRate}%)`,
    ],
    riskLevel: riskFromInsight(insight.overallLevel),
    observationLines: [
      result.attendance.totalDays === 0 && result.feeding.totalMeals === 0
        ? language === "tl"
          ? "Wala pang sapat na records para sa napiling timeframe."
          : "There are not enough records for the selected timeframe yet."
        : undefined,
      insight.attendance.interpretation,
      insight.feeding.interpretation,
      formatAbsentDatesLine(result.attendance.absentDates, language),
      formatFoodsLine(result.feeding.foods, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines,
  };
}

type WriterTool = WriterSupportedResult["tool"];
type WriterFactsBuilderMap = {
  [K in WriterTool]?: (
    result: Extract<WriterSupportedResult, { tool: K }>,
    role: AIRole,
    language: AIResponseLanguage,
  ) => Promise<WriterFacts>;
};

const WRITER_FACT_BUILDERS: WriterFactsBuilderMap = {
  summarize_attendance_class: async (result, role, language) =>
    buildFactsFromClassAttendance(result, role, language),
  summarize_feeding_class: async (result, role, language) =>
    buildFactsFromClassFeeding(result, role, language),
  generate_class_report: async (result, role, language) =>
    buildFactsFromClassReport(result, role, language),
  summarize_attendance_comparison: buildFactsFromAttendanceComparison,
  summarize_feeding_comparison: buildFactsFromFeedingComparison,
  summarize_child_trend: async (result, role, language) =>
    buildFactsFromChildTrend(result, role, language),
  summarize_attendance: buildFactsFromChildAttendance,
  summarize_feeding: buildFactsFromChildFeeding,
};

export function buildFacts(params: {
  result: WriterSupportedResult;
  role: AIRole;
  language: AIResponseLanguage;
}): Promise<WriterFacts> {
  const { result, role, language } = params;
  const builder = WRITER_FACT_BUILDERS[result.tool] as
    | ((
        result: WriterSupportedResult,
        role: AIRole,
        language: AIResponseLanguage,
      ) => Promise<WriterFacts>)
    | undefined;

  if (builder) {
    return builder(result, role, language);
  }

  return buildFactsFromChildReport(
    result as Extract<WriterSupportedResult, { tool: "generate_child_report" }>,
    role,
    language,
  );
}

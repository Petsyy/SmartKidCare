import type { NutritionAnalyticsData } from "@/api/nutrition.api";
import type { CompetencyAnalyticsPayload } from "../hooks/useCompetencyAnalytics";
import type { CsvRow } from "./csv-export";

export const formatReportSchoolYear = (
  selectedSchoolYear: string,
  availableSchoolYears: string[],
) => {
  if (selectedSchoolYear && selectedSchoolYear !== "all") {
    return selectedSchoolYear;
  }
  if (availableSchoolYears.length === 1) return availableSchoolYears[0];
  return "All School Years";
};

export const formatCompetencyPeriod = (
  period: CompetencyAnalyticsPayload["filters"]["period"],
) => {
  if (period === "quarterly") return "Quarterly Evaluations";
  if (period === "final") return "Final Evaluations";
  return "All Evaluation Periods";
};

export const buildNutritionCsvRows = (
  data: NutritionAnalyticsData,
  generatedAt: string,
): CsvRow[] => {
  const percentage = (count: number) =>
    data.totalEvaluated > 0
      ? `${((count / data.totalEvaluated) * 100).toFixed(1)}%`
      : "0.0%";

  const periodRows: CsvRow[] = (["initial", "quarterly", "final"] as const).flatMap(
    (period) => {
      const values = data.periods[period];
      const label = period.charAt(0).toUpperCase() + period.slice(1);
      return [
        [label, "Submitted Assessments", values.submittedCount],
        [label, "Severely Underweight", values.severelyUnderweightCount],
        [label, "Underweight", values.underweightCount],
        [label, "Normal", values.normalCount],
        [label, "Overweight", values.overweightCount],
        [label, "Obese", values.obeseCount],
      ];
    },
  );
  const comparisonRows: CsvRow[] = ([
    ["Initial to Quarterly", data.comparisons.initialToQuarterly],
    ["Quarterly to Final", data.comparisons.quarterlyToFinal],
    ["Initial to Final", data.comparisons.initialToFinal],
  ] as const).map(([label, summary]) => [
    label,
    summary.totalEvaluated,
    summary.initiallyMalnourished,
    summary.improvedToNormal,
    summary.remainedMalnourished,
    `${summary.improvementRate}%`,
  ]);

  return [
    ["SMARTKIDCARE HEALTH & NUTRITION REPORT"],
    [
      "School Year",
      formatReportSchoolYear(data.filters.schoolYear, data.schoolYears),
    ],
    ["Generated At", generatedAt],
    [],
    ["ASSESSMENT PERIOD DISTRIBUTIONS"],
    ["Period", "Metric", "Students"],
    ...periodRows,
    [],
    ["PROGRESS COMPARISONS"],
    ["Comparison", "Students Compared", "Initially Malnourished", "Improved to Normal", "Remained Malnourished", "Improvement Rate"],
    ...comparisonRows,
    [],
    ["NUTRITION PROGRESS"],
    ["Metric", "Value", "Unit"],
    ["Total Evaluated", data.totalEvaluated, "Students"],
    ["Initially Malnourished", data.initiallyMalnourished, "Students"],
    ["Improved to Normal", data.improvedToNormal, "Students"],
    ["Remained Malnourished", data.remainedMalnourished, "Students"],
    ["Improvement Rate", `${data.improvementRate}%`, "Percent"],
    [],
    ["NUTRITIONAL STATUS DISTRIBUTION"],
    ["Status", "Number of Students", "Percentage"],
    [
      "Severely Underweight",
      data.severelyUnderweightCount,
      percentage(data.severelyUnderweightCount),
    ],
    ["Underweight", data.underweightCount, percentage(data.underweightCount)],
    ["Normal", data.normalCount, percentage(data.normalCount)],
    ["Overweight", data.overweightCount, percentage(data.overweightCount)],
    ["Obese", data.obeseCount, percentage(data.obeseCount)],
  ];
};

export const buildCompetencyCsvRows = (
  data: CompetencyAnalyticsPayload,
  generatedAt: string,
): CsvRow[] => {
  const periodRows = (["quarterly", "final"] as const).flatMap((period) => [
    [period === "quarterly" ? "QUARTERLY DISTRIBUTION" : "FINAL DISTRIBUTION"],
    ["Students Evaluated", data.periods[period].totalStudents],
    ["Competency", "Category", "Achieved", "Developing", "Emerging", "Not Yet", "Total Evaluated", "Achieved Rate"],
    ...data.periods[period].competencies.map((item) => [
      item.name,
      item.category,
      item.distribution.achieved,
      item.distribution.developing,
      item.distribution.emerging,
      item.distribution.not_demonstrated,
      item.totalEvaluated,
      `${item.achievedRate}%`,
    ]),
    [],
  ] as CsvRow[]);
  return [
  ["SMARTKIDCARE ACADEMIC COMPETENCY REPORT"],
  [
    "School Year",
    formatReportSchoolYear(data.filters.schoolYear, data.schoolYears),
  ],
  ["Evaluation Period", formatCompetencyPeriod(data.filters.period)],
  ["Total Students", data.totalStudents],
  ["Generated At", generatedAt],
  [],
  ["QUARTERLY TO FINAL PROGRESS"],
  ["Matched Students", data.comparison.matchedStudents],
  ["Compared Ratings", data.comparison.totalComparedRatings],
  ["Improved Ratings", data.comparison.improvedRatings],
  ["Unchanged Ratings", data.comparison.unchangedRatings],
  ["Declined Ratings", data.comparison.declinedRatings],
  ["Improvement Rate", `${data.comparison.improvementRate}%`],
  [],
  ...periodRows,
  ["COMPETENCY RATING DISTRIBUTION"],
  [
    "Competency",
    "Category",
    "Achieved",
    "Developing",
    "Emerging",
    "Not Yet",
    "Total Evaluated",
    "Achieved Rate",
  ],
  ...data.competencies.map((item) => [
    item.name,
    item.category,
    item.distribution.achieved,
    item.distribution.developing,
    item.distribution.emerging,
    item.distribution.not_demonstrated,
    item.totalEvaluated,
    `${item.achievedRate}%`,
  ]),
  ];
};

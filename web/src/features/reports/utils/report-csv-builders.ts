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

  return [
    ["SMARTKIDCARE HEALTH & NUTRITION REPORT"],
    [
      "School Year",
      formatReportSchoolYear(data.filters.schoolYear, data.schoolYears),
    ],
    ["Generated At", generatedAt],
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
): CsvRow[] => [
  ["SMARTKIDCARE ACADEMIC COMPETENCY REPORT"],
  [
    "School Year",
    formatReportSchoolYear(data.filters.schoolYear, data.schoolYears),
  ],
  ["Evaluation Period", formatCompetencyPeriod(data.filters.period)],
  ["Total Students", data.totalStudents],
  ["Generated At", generatedAt],
  [],
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

import type { NutritionAnalyticsData } from "@/api/nutrition.api";
import type { CompetencyAnalyticsPayload } from "../hooks/useCompetencyAnalytics";
import type { CsvRow } from "./csv-export";

export const buildNutritionCsvRows = (
  data: NutritionAnalyticsData,
  generatedAt: string,
): CsvRow[] => [
  ["Report", "School Year", "Metric", "Value", "Generated At"],
  ["Health & Nutrition", data.filters.schoolYear, "Total Evaluated", data.totalEvaluated, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Initially Malnourished", data.initiallyMalnourished, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Improved to Normal", data.improvedToNormal, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Remained Malnourished", data.remainedMalnourished, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Improvement Rate", `${data.improvementRate}%`, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Severely Underweight", data.severelyUnderweightCount, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Underweight", data.underweightCount, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Normal", data.normalCount, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Overweight", data.overweightCount, generatedAt],
  ["Health & Nutrition", data.filters.schoolYear, "Obese", data.obeseCount, generatedAt],
];

export const buildCompetencyCsvRows = (
  data: CompetencyAnalyticsPayload,
  generatedAt: string,
): CsvRow[] => [
  [
    "Competency",
    "Category",
    "School Year",
    "Achieved",
    "Developing",
    "Emerging",
    "Not Yet",
    "Total Evaluated",
    "Achieved Rate",
    "Generated At",
  ],
  ...data.competencies.map((item) => [
    item.name,
    item.category,
    data.filters.schoolYear,
    item.distribution.achieved,
    item.distribution.developing,
    item.distribution.emerging,
    item.distribution.not_demonstrated,
    item.totalEvaluated,
    `${item.achievedRate}%`,
    generatedAt,
  ]),
];

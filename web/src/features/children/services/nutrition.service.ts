import { apiRequestOrThrow } from "@/api/api-client";

export interface NutritionRecord {
  _id: string;
  childId: string;
  schoolYear: string;
  period: "initial" | "quarterly" | "final";
  recordedBy: string;
  status: "draft" | "submitted";
  weight: number;
  height: number;
  bmi: number;
  nutritionalStatus: string;
  measurementDate: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NutritionProgressSummary = {
  totalEvaluated: number;
  initiallyMalnourished: number;
  improvedToNormal: number;
  remainedMalnourished: number;
  improvementRate: number;
};

export type NutritionStatusDistribution = {
  submittedCount: number;
  underweightCount: number;
  severelyUnderweightCount: number;
  normalCount: number;
  overweightCount: number;
  obeseCount: number;
};

export type NutritionAnalyticsData = NutritionProgressSummary & {
  filters: {
    schoolYear: string;
  };
  schoolYears: string[];
  totalSubmitted: number;
  assessedStudents: number;
  periods: Record<
    "initial" | "quarterly" | "final",
    NutritionStatusDistribution
  >;
  comparisons: Record<
    "initialToQuarterly" | "quarterlyToFinal" | "initialToFinal",
    NutritionProgressSummary
  >;
  underweightCount: number;
  severelyUnderweightCount: number;
  normalCount: number;
  overweightCount: number;
  obeseCount: number;
};

export type NutritionAnalyticsFilters = {
  schoolYear?: string;
};

export class NutritionService {
  async getChildNutritionHistory(
    childId: string,
  ): Promise<NutritionRecord[]> {
    const response = await apiRequestOrThrow<{ data: NutritionRecord[] }>(
      `/nutrition/child/${childId}`,
      "Failed to fetch nutrition history",
    );
    return response.data;
  }

  async getNutritionAnalytics({
    schoolYear,
  }: NutritionAnalyticsFilters): Promise<NutritionAnalyticsData> {
    const params = new URLSearchParams();
    if (schoolYear) params.set("schoolYear", schoolYear);
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    const response = await apiRequestOrThrow<{ data: NutritionAnalyticsData }>(
      `/nutrition/analytics${suffix}`,
      "Failed to fetch analytics",
    );
    return response.data;
  }
}

export const nutritionService = new NutritionService();

// Bound method aliases for backwards compatibility
export const getChildNutritionHistory = (childId: string) =>
  nutritionService.getChildNutritionHistory(childId);
export const getNutritionAnalytics = (filters: NutritionAnalyticsFilters) =>
  nutritionService.getNutritionAnalytics(filters);

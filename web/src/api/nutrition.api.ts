import { apiRequestOrThrow } from "./api-client";

export interface NutritionRecord {
  _id: string;
  childId: string;
  schoolYear: string;
  period: "initial" | "final";
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

export type NutritionAnalyticsData = {
  filters: {
    schoolYear: string;
    centerId: string | null;
  };
  schoolYears: string[];
  totalEvaluated: number;
  initiallyMalnourished: number;
  improvedToNormal: number;
  remainedMalnourished: number;
  improvementRate: number;
};

export type NutritionAnalyticsFilters = {
  schoolYear?: string;
  centerId?: string;
};

export const getChildNutritionHistory = async (
  childId: string,
): Promise<NutritionRecord[]> => {
  const response = await apiRequestOrThrow<{ data: NutritionRecord[] }>(
    `/nutrition/child/${childId}`,
    "Failed to fetch nutrition history",
  );
  return response.data;
};

export const getNutritionAnalytics = async ({
  schoolYear,
  centerId,
}: NutritionAnalyticsFilters): Promise<NutritionAnalyticsData> => {
  const params = new URLSearchParams();
  if (schoolYear) params.set("schoolYear", schoolYear);
  if (centerId) params.set("centerId", centerId);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response = await apiRequestOrThrow<{ data: NutritionAnalyticsData }>(
    `/nutrition/analytics${suffix}`,
    "Failed to fetch analytics",
  );
  return response.data;
};

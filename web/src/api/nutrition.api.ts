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

export const getChildNutritionHistory = async (
  childId: string,
): Promise<NutritionRecord[]> => {
  const response = await apiRequestOrThrow<{ data: NutritionRecord[] }>(
    `/nutrition/child/${childId}`,
    "Failed to fetch nutrition history",
  );
  return response.data;
};

export const getNutritionAnalytics = async (schoolYear: string) => {
  const params = new URLSearchParams({ schoolYear }).toString();
  const response = await apiRequestOrThrow<{ data: any }>(
    `/nutrition/analytics?${params}`,
    "Failed to fetch analytics",
  );
  return response.data;
};

import { apiClient } from "./client";

export type NutritionPeriod = "initial" | "quarterly" | "final";

export interface NutritionRecord {
  _id: string;
  childId: string;
  schoolYear: string;
  period?: NutritionPeriod;
  ageInMonths: number;
  sex: "male" | "female";
  recordedBy: string;
  status: "draft" | "submitted";
  weight: number;
  height: number;
  bmi: number;
  nutritionalStatus: string;
  measurementDate: string;
  submittedAt?: string;
}

export const getMyClassNutrition = async (
  schoolYear: string,
  period?: NutritionPeriod,
) => {
  const query = new URLSearchParams({
    schoolYear,
    ...(period ? { period } : {}),
  }).toString();
  const data = await apiClient<{ data: any }>(
    `/api/nutrition/my-class?${query}`,
  );
  return data.data;
};

export const evaluateNutrition = async (payload: {
  childId: string;
  schoolYear: string;
  period?: NutritionPeriod;
  measurementDate?: string;
  weight: number;
  height: number;
  action: "draft" | "submit";
}) => {
  const data = await apiClient<{ data: NutritionRecord }>(
    `/api/nutrition/evaluate`,
    {
      method: "POST",
      body: payload,
    },
  );
  return data.data;
};

export const getChildNutritionHistory = async (childId: string) => {
  const data = await apiClient<{ data: NutritionRecord[] }>(
    `/api/nutrition/child/${childId}`,
  );
  return data.data;
};

import { apiClient } from "../../../api/client";

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
}

export const getMyClassNutrition = async (schoolYear: string, period: "initial" | "final") => {
  const query = new URLSearchParams({ schoolYear, period }).toString();
  const data = await apiClient<{ data: any }>(`/nutrition/my-class?${query}`);
  return data.data;
};

export const evaluateNutrition = async (payload: {
  childId: string;
  schoolYear: string;
  period: "initial" | "final";
  weight: number;
  height: number;
  action: "draft" | "submit";
}) => {
  const data = await apiClient<{ data: NutritionRecord }>(`/nutrition/evaluate`, {
    method: "POST",
    body: payload,
  });
  return data.data;
};

export const getChildNutritionHistory = async (childId: string) => {
  const data = await apiClient<{ data: NutritionRecord[] }>(`/nutrition/child/${childId}`);
  return data.data;
};

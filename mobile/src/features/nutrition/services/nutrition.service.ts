import { apiClient } from "@/src/api/client";

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
  measurementDateKey?: string;
  submittedAt?: string;
}

export class NutritionService {
  async getMyClassNutrition(
    schoolYear: string,
    period?: NutritionPeriod,
    measurementDateKey?: string,
  ): Promise<any> {
    const query = new URLSearchParams({
      schoolYear,
      ...(period ? { period } : {}),
      ...(measurementDateKey ? { measurementDateKey } : {}),
    }).toString();
    const data = await apiClient<{ data: any }>(
      `/api/nutrition/my-class?${query}`,
    );
    return data.data;
  }

  async evaluateNutrition(payload: {
    childId: string;
    schoolYear: string;
    period?: NutritionPeriod;
    measurementDate?: string;
    weight: number;
    height: number;
    action: "draft" | "submit";
  }): Promise<NutritionRecord> {
    const data = await apiClient<{ data: NutritionRecord }>(
      `/api/nutrition/evaluate`,
      {
        method: "POST",
        body: payload,
      },
    );
    return data.data;
  }

  async getChildNutritionHistory(childId: string): Promise<NutritionRecord[]> {
    const data = await apiClient<{ data: NutritionRecord[] }>(
      `/api/nutrition/child/${childId}`,
    );
    return data.data;
  }
}

export const nutritionService = new NutritionService();

// Backwards-compatible bound aliases
export const getMyClassNutrition = (
  schoolYear: string,
  period?: NutritionPeriod,
  measurementDateKey?: string,
) => nutritionService.getMyClassNutrition(schoolYear, period, measurementDateKey);

export const evaluateNutrition = (payload: {
  childId: string;
  schoolYear: string;
  period?: NutritionPeriod;
  measurementDate?: string;
  weight: number;
  height: number;
  action: "draft" | "submit";
}) => nutritionService.evaluateNutrition(payload);

export const getChildNutritionHistory = (childId: string) =>
  nutritionService.getChildNutritionHistory(childId);

import type { EditableNutritionPeriod } from "../types";

export const getCurrentSchoolYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, so June = 5
  return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export const nutritionDraftScopeKey = (
  childId: string,
  schoolYear: string,
  period: EditableNutritionPeriod,
  measurementDateKey: string,
) => `${schoolYear}:${period}:${measurementDateKey}:${childId}`;

export const nutritionInputKey = (
  childId: string,
  period: EditableNutritionPeriod,
  measurementDateKey: string,
) => `${period}:${measurementDateKey}:${childId}`;

export const legacyNutritionDraftScopeKey = (
  childId: string,
  schoolYear: string,
  period: EditableNutritionPeriod,
) => `${schoolYear}:${period}:${childId}`;


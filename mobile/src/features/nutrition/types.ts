import type { NutritionPeriod } from "@/src/api/nutrition.api";

export type EditableNutritionPeriod = Extract<
  NutritionPeriod,
  "quarterly" | "final"
>;

export interface NutritionMeasurementInput {
  weight: string;
  height: string;
}


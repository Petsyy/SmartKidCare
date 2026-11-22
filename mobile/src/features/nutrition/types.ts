import type { NutritionPeriod } from "./services";

export type EditableNutritionPeriod = Extract<
  NutritionPeriod,
  "quarterly" | "final"
>;

export interface NutritionMeasurementInput {
  weight: string;
  height: string;
}


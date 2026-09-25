import { z } from "zod";

// ─── Constants ───────────────────────────────────────────────────────────────


export const WEIGHT_MIN_KG = 5;
export const WEIGHT_MAX_KG = 50;
export const HEIGHT_MIN_CM = 60;
export const HEIGHT_MAX_CM = 150;
const WEIGHT_MAX_DECIMALS = 1;
const HEIGHT_MAX_DECIMALS = 1;

/** Max characters allowed in the weight TextInput (e.g. "50.0") */
export const WEIGHT_MAX_INPUT_LENGTH = 4;
/** Max characters allowed in the height TextInput (e.g. "150.0") */
export const HEIGHT_MAX_INPUT_LENGTH = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NUMERIC_REGEX = /^\d+(\.\d+)?$/;

const hasExcessiveDecimals = (value: string, maxDecimals: number): boolean => {
  const parts = value.split(".");
  return parts.length === 2 && parts[1].length > maxDecimals;
};

// ─── Schema ──────────────────────────────────────────────────────────────────

export const nutritionAssessmentSchema = z.object({
  weight: z
    .string()
    .trim()
    .min(1, "Weight is required.")
    .refine((v) => NUMERIC_REGEX.test(v), "Weight must be a valid number.")
    .refine(
      (v) => !hasExcessiveDecimals(v, WEIGHT_MAX_DECIMALS),
      `Weight allows at most ${WEIGHT_MAX_DECIMALS} decimal place.`,
    )
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= WEIGHT_MIN_KG && n <= WEIGHT_MAX_KG;
    }, `Weight must be between ${WEIGHT_MIN_KG} and ${WEIGHT_MAX_KG} kg.`),

  height: z
    .string()
    .trim()
    .min(1, "Height is required.")
    .refine((v) => NUMERIC_REGEX.test(v), "Height must be a valid number.")
    .refine(
      (v) => !hasExcessiveDecimals(v, HEIGHT_MAX_DECIMALS),
      `Height allows at most ${HEIGHT_MAX_DECIMALS} decimal place.`,
    )
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= HEIGHT_MIN_CM && n <= HEIGHT_MAX_CM;
    }, `Height must be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm.`),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type NutritionAssessmentInput = z.infer<
  typeof nutritionAssessmentSchema
>;

export type NutritionAssessmentField = keyof NutritionAssessmentInput;

export type NutritionAssessmentErrors = Partial<
  Record<NutritionAssessmentField, string>
>;

// ─── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate the full form and return a map of field → error message.
 * Returns an empty object when there are no errors.
 */
export const validateNutritionAssessment = (
  input: NutritionAssessmentInput,
): NutritionAssessmentErrors => {
  const result = nutritionAssessmentSchema.safeParse(input);

  if (result.success) return {};

  const errors: NutritionAssessmentErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as NutritionAssessmentField;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
};

/**
 * Validate a single field and return its error message, or undefined if valid.
 */
export const validateNutritionField = (
  field: NutritionAssessmentField,
  value: string,
): string | undefined => {
  const fieldSchema =
    nutritionAssessmentSchema.shape[field];

  const result = fieldSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

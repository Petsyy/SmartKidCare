import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID.");

export const getMyClassSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  period: z
    .preprocess(
      (val) =>
        val === "" || val === "all" || val === "undefined" || val === "null"
          ? undefined
          : val,
      z.enum(["initial", "quarterly", "final"]),
    )
    .optional()
    .describe("The period of the assessment (e.g., initial, quarterly, final)"),
});

export const evaluateNutritionSchema = z.object({
  childId: objectIdSchema,
  schoolYear: z.string().min(1, "School year is required"),
  period: z
    .preprocess(
      (val) =>
        val === "" || val === "undefined" || val === "null" ? undefined : val,
      z.enum(["initial", "quarterly", "final"]),
    )
    .optional()
    .describe("Assessment period"),
  measurementDate: z.string().datetime({ offset: true }).optional(),
  weight: z.coerce
    .number()
    .min(5, "Weight must be at least 5 kg.")
    .max(50, "Weight must not exceed 50 kg."),
  height: z.coerce
    .number()
    .min(60, "Height must be at least 60 cm.")
    .max(150, "Height must not exceed 150 cm."),
  action: z.enum(["draft", "submit"]),
});

export const validateGetMyClass = validate(getMyClassSchema, "query");
export const validateEvaluateNutrition = validate(evaluateNutritionSchema);
export const validateNutritionAnalytics = validate(
  z.object({
    schoolYear: z.string().trim().min(1).max(20).optional(),
    centerId: objectIdSchema.optional(),
  }),
  "query",
);
export const validateChildNutritionParams = validate(
  z.object({ id: objectIdSchema }),
  "params",
);

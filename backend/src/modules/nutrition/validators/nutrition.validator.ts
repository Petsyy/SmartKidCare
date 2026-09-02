import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid ID.");

export const getMyClassSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  period: z.enum(["initial", "final"]),
});

export const evaluateNutritionSchema = z.object({
  childId: objectIdSchema,
  schoolYear: z.string().min(1, "School year is required"),
  period: z.enum(["initial", "final"]),
  weight: z.coerce.number().min(0.1, "Weight must be a positive number"),
  height: z.coerce.number().min(10, "Height must be a valid number in cm"),
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

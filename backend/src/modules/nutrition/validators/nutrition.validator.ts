import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

export const getMyClassSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  period: z.enum(["initial", "final"]),
});

export const evaluateNutritionSchema = z.object({
  childId: z.string().min(1, "Valid child ID is required"),
  schoolYear: z.string().min(1, "School year is required"),
  period: z.enum(["initial", "final"]),
  weight: z.coerce.number().min(0.1, "Weight must be a positive number"),
  height: z.coerce.number().min(10, "Height must be a valid number in cm"),
  action: z.enum(["draft", "submit"]),
});

export const validateGetMyClass = validate(getMyClassSchema, "query");
export const validateEvaluateNutrition = validate(evaluateNutritionSchema);

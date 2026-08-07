import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const emailSchema = z.email("Invalid email format.").trim();
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format.");

const createDaycareCenterSchema = z.object({
  name: nonEmptyString,
  barangay: nonEmptyString,
  code: nonEmptyString,
  address: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

const updateDaycareCenterSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty.").optional(),
  barangay: z.string().trim().min(1, "Barangay cannot be empty.").optional(),
  address: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

const getDaycareCentersQuerySchema = z.object({
  barangay: z.string().trim().optional(),
});

const createTeacherSchema = z.object({
  firstName: nonEmptyString,
  middleName: nonEmptyString,
  lastName: nonEmptyString,
  email: emailSchema,
  phone: nonEmptyString,
  daycareCenterId: objectIdSchema,
});

const updateUserProfileSchema = z.object({
  firstName: nonEmptyString,
  middleName: nonEmptyString,
  lastName: nonEmptyString,
  email: emailSchema,
  phone: nonEmptyString,
  daycareCenterId: z
    .union([objectIdSchema, z.literal(""), z.null()])
    .optional(),
});

export const validateCreateDaycareCenter = validate(createDaycareCenterSchema);
export const validateUpdateDaycareCenter = validate(updateDaycareCenterSchema);
export const validateGetDaycareCentersQuery = validate(
  getDaycareCentersQuerySchema,
  "query",
);
export const validateCreateTeacher = validate(createTeacherSchema);
export const validateUpdateUserProfile = validate(updateUserProfileSchema);

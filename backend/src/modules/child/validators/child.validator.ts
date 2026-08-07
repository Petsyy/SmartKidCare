import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";
import { CHILD_GENDERS, CHILD_PROGRAM_TYPES } from "../shared";

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const emailSchema = z.string().trim().email("Invalid email address.");

export const createChildSchema = z.object({
  firstName: nonEmptyString,
  middleName: z.string().trim().optional(),
  lastName: nonEmptyString,
  dateOfBirth: nonEmptyString,
  age: z.coerce.number().min(0).optional(),
  gender: z.enum(CHILD_GENDERS as any, {
    message: "Gender must be either male or female.",
  }),
  homeAddress: z.string().trim().min(5).max(300),
  parentRelationship: z.enum(["Mother", "Father", "Guardian", "Grandparent", "Other"]),
  programType: z.enum(CHILD_PROGRAM_TYPES as any, {
    message: "A valid program type is required.",
  }),
  enrollmentDate: nonEmptyString,
  schoolYear: z.string().trim().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  studentId: z.string().trim().optional(),
  teacherId: z.string().trim().optional(),
  parentFirstName: z.string().trim().optional(),
  parentMiddleName: z.string().trim().optional(),
  parentLastName: z.string().trim().optional(),
  parentEmail: z.string().trim().email("Invalid parent email address.").optional().or(z.literal("")),
  parentPhone: z.string().trim().optional(),
}).refine(data => {
  const hasAnyParentInput = Boolean(data.parentFirstName || data.parentMiddleName || data.parentLastName || data.parentEmail || data.parentPhone);
  const hasParentInfo = Boolean(data.parentFirstName && data.parentLastName && data.parentEmail);
  if (hasAnyParentInput && !hasParentInfo) {
    return false;
  }
  return true;
}, {
  message: "Parent first name, last name, and email are required together.",
  path: ["parentFirstName"]
});

export const updateChildSchema = z.object({
  firstName: z.string().trim().optional(),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  age: z.coerce.number().min(0).optional(),
  gender: z.enum(CHILD_GENDERS as any).optional(),
  homeAddress: z.string().trim().min(5).max(300).optional(),
  parentRelationship: z.enum(["Mother", "Father", "Guardian", "Grandparent", "Other"]).optional(),
  weight: z.coerce.number().min(5).max(50).optional(),
  height: z.coerce.number().min(60).max(150).optional(),
  schoolYear: z.string().trim().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  unlinkParent: z.boolean().optional(),
  teacherId: z.string().trim().optional(),
  unlinkTeacher: z.boolean().optional(),
});

export const validateCreateChild = validate(createChildSchema);
export const validateUpdateChild = validate(updateChildSchema);

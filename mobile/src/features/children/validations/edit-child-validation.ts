import { z } from "zod";
import {
  nameSchema,
  ymdDateSchema,
  CHILD_GENDERS,
  PARENT_RELATIONSHIPS,
  computeAgeFromDateOfBirth,
  parseYmd,
} from "../../../shared/validations/child-validation-utils";

export const editChildSchema = z
  .object({
    firstName: nameSchema("First name"),
    middleName: z.string().trim().optional(),
    lastName: nameSchema("Last name"),
    dateOfBirth: ymdDateSchema("Date of birth"),
    gender: z.enum(CHILD_GENDERS, {
      required_error: "Gender is required.",
      invalid_type_error: "Gender is required.",
    }),
    homeAddress: z
      .string()
      .trim()
      .min(5, "Complete home address is required.")
      .max(200, "Address must be at most 200 characters."),
    parentRelationship: z.enum(PARENT_RELATIONSHIPS, {
      required_error: "Relationship to the child is required.",
    }),
  })
  .superRefine((data, ctx) => {
    const birthDate = parseYmd(data.dateOfBirth);
    if (!birthDate) return;

    const age = computeAgeFromDateOfBirth(data.dateOfBirth);
    if (age < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Child must be at least 3 years old.",
      });
    }
  });

export type EditChildFormValues = z.infer<typeof editChildSchema>;

export const validateEditChild = (payload: any) =>
  editChildSchema.safeParse(payload);

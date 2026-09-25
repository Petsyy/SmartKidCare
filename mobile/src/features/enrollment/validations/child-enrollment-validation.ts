import { z } from "zod";
import {
  nameSchema,
  phoneSchema,
  ymdDateSchema,
  numericRangeSchema,
  computeAgeFromDateOfBirth,
  parseYmd,
  PROGRAM_TYPES,
  SCHOOL_YEAR_REGEX,
} from "../../../shared/validations/child-validation-utils";

// ─── Step 1: Child Information, Health & Enrollment ──────────────────────────

export const childEnrollmentStepOneSchema = z
  .object({
    firstName: nameSchema("First name"),
    middleName: nameSchema("Middle name"),
    lastName: nameSchema("Last name"),
    dateOfBirth: ymdDateSchema("Date of birth"),
    gender: z.enum(["male", "female"], {
      required_error: "Gender is required.",
      invalid_type_error: "Gender is required.",
    }),
    homeAddress: z
      .string()
      .trim()
      .min(5, "Complete home address is required.")
      .max(200, "Address must be at most 200 characters."),
    daycareCenterId: z.string().trim().min(1, "Assigned center is required."),
    programType: z.enum(PROGRAM_TYPES, {
      required_error: "Program type is required.",
      invalid_type_error: "Program type is required.",
    }),
    enrollmentDate: ymdDateSchema("Enrollment date"),
    schoolYear: z.string().trim().min(1, "School year is required."),
    weight: numericRangeSchema("Weight", 5, 50, "kg"),
    height: numericRangeSchema("Height", 60, 150, "cm"),
  })
  .superRefine((data, ctx) => {
    const birthDate = parseYmd(data.dateOfBirth);
    if (!birthDate) return;

    const age = computeAgeFromDateOfBirth(data.dateOfBirth);
    if (age < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Child must be at least 3 years old at enrollment.",
      });
      return;
    }

    const schoolYearMatch = SCHOOL_YEAR_REGEX.exec(data.schoolYear);
    if (schoolYearMatch) {
      const endYear = Number(schoolYearMatch[2]);
      const schoolYearEnd = new Date(endYear, 2, 31);

      const fifthBirthday = new Date(
        birthDate.getFullYear() + 5,
        birthDate.getMonth(),
        birthDate.getDate(),
      );

      if (fifthBirthday <= schoolYearEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateOfBirth"],
          message:
            "Child must not turn 5 years old during the school year (June–March). " +
            "Only children who will remain 4 or younger throughout the entire school year are accepted.",
        });
      }
    }
  });

// ─── Step 2: Parent / Guardian Information ───────────────────────────────────

export const childEnrollmentStepTwoSchema = z.object({
  parentFirstName: nameSchema("First name"),
  parentMiddleName: nameSchema("Middle name"),
  parentLastName: nameSchema("Last name"),
  parentPhone: phoneSchema(),
  parentRelationship: z.enum(
    ["Mother", "Father", "Guardian", "Grandparent", "Other"],
    { required_error: "Relationship to the child is required." },
  ),
});

// ─── Validate Helpers ────────────────────────────────────────────────────────

export const validateChildEnrollmentStepOne = (payload: {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  homeAddress: string;
  daycareCenterId: string;
  programType: (typeof PROGRAM_TYPES)[number] | "";
  enrollmentDate: string;
  schoolYear: string;
  weight: string;
  height: string;
}) => childEnrollmentStepOneSchema.safeParse(payload);

export const validateChildEnrollmentStepTwo = (payload: {
  parentFirstName: string;
  parentMiddleName: string;
  parentLastName: string;
  parentPhone: string;
  parentRelationship:
    "Mother" | "Father" | "Guardian" | "Grandparent" | "Other";
}) => childEnrollmentStepTwoSchema.safeParse(payload);

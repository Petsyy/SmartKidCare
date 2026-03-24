import { z } from "zod";

const PROGRAM_TYPES = [
  "4Ps Beneficiary",
  "Regular Enrollee (Non-beneficiary)",
] as const;

const parseYmd = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export const computeAgeFromDateOfBirth = (value: string) => {
  const birthDate = parseYmd(value);
  if (!birthDate) return 0;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return Math.max(0, age);
};

const ymdDateSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => parseYmd(value) !== null, {
      message: `${label} must be a valid date.`,
    });

export const childEnrollmentStepOneSchema = z
  .object({
    firstName: z.string().trim().min(1, "Child first name is required."),
    middleName: z.string().trim().min(1, "Child middle name is required."),
    lastName: z.string().trim().min(1, "Child last name is required."),
    dateOfBirth: ymdDateSchema("Date of birth"),
    gender: z.enum(["male", "female"], {
      required_error: "Gender is required.",
      invalid_type_error: "Gender is required.",
    }),
    daycareCenterId: z
      .string()
      .trim()
      .min(1, "Assigned center is required."),
    programType: z.enum(PROGRAM_TYPES, {
      required_error: "Program type is required.",
      invalid_type_error: "Program type is required.",
    }),
    enrollmentDate: ymdDateSchema("Enrollment date"),
    schoolYear: z.string().trim().min(1, "School year is required."),
  })
  .superRefine((data, ctx) => {
    const age = computeAgeFromDateOfBirth(data.dateOfBirth);

    if (age < 3 || age > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Child age must be between 3 and 5 years old only.",
      });
    }
  });

const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const childEnrollmentStepTwoSchema = z.object({
  parentFirstName: z.string().trim().min(1, "Parent first name is required."),
  parentMiddleName: z.string().trim().min(1, "Parent middle name is required."),
  parentLastName: z.string().trim().min(1, "Parent last name is required."),
  parentEmail: z
    .string()
    .trim()
    .min(1, "Parent email is required.")
    .regex(simpleEmailRegex, "Please enter a valid parent email address."),
  parentPhone: z.string().trim().min(1, "Parent phone is required."),
});

export const validateChildEnrollmentStepOne = (payload: {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  daycareCenterId: string;
  programType: (typeof PROGRAM_TYPES)[number] | "";
  enrollmentDate: string;
  schoolYear: string;
}) => childEnrollmentStepOneSchema.safeParse(payload);

export const validateChildEnrollmentStepTwo = (payload: {
  parentFirstName: string;
  parentMiddleName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
}) => childEnrollmentStepTwoSchema.safeParse(payload);

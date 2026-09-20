import { z } from "zod";

// ─── Constants ───────────────────────────────────────────────────────────────

const NAME_REGEX = /^[a-zA-Z\s\-']+$/;
const PH_PHONE_REGEX = /^09\d{9}$/;
const YMD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const SCHOOL_YEAR_REGEX = /([0-9]{4})\s*[-–]\s*([0-9]{4})/;

const PROGRAM_TYPES = [
  "4Ps Beneficiary",
  "Regular Enrollee (Non-beneficiary)",
] as const;

// ─── Date Helpers ────────────────────────────────────────────────────────────

const parseYmd = (value: string): Date | null => {
  const match = YMD_REGEX.exec(String(value || "").trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  const isValid =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  return isValid ? parsed : null;
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

// ─── Reusable Schema Builders ────────────────────────────────────────────────

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .min(2, `${label} is too short.`)
    .max(30, `${label} must be at most 30 characters.`)
    .regex(/^(?!.*\s{2,})/, `${label} cannot contain consecutive spaces.`)
    .regex(NAME_REGEX, `${label} contains invalid characters.`)
    .refine((val) => {
      const words = val.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        if (words[i] === words[i + 1]) return false;
      }
      return true;
    }, `${label} cannot contain the same word twice in a row.`);

const phoneSchema = () =>
  z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .length(11, "Phone number must be exactly 11 digits.")
    .regex(PH_PHONE_REGEX, "Phone must start with 09 and be 11 digits.");

const ymdDateSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => parseYmd(value) !== null, {
      message: `${label} must be a valid date.`,
    });

const numericRangeSchema = (
  label: string,
  min: number,
  max: number,
  unit: string,
) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(5, `${label} must be at most 5 characters.`)
    .refine(
      (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= min && n <= max;
      },
      { message: `${label} must be between ${min} and ${max} ${unit}.` },
    );

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

import { z } from "zod";

// ─── Constants ───────────────────────────────────────────────────────────────

export const NAME_REGEX = /^[a-zA-Z\s\-']+$/;
export const PH_PHONE_REGEX = /^09\d{9}$/;
export const YMD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
export const SCHOOL_YEAR_REGEX = /([0-9]{4})\s*[-–]\s*([0-9]{4})/;

export const PROGRAM_TYPES = [
  "4Ps Beneficiary",
  "Regular Enrollee (Non-beneficiary)",
] as const;

export const CHILD_GENDERS = ["male", "female"] as const;

export const PARENT_RELATIONSHIPS = [
  "Mother",
  "Father",
  "Guardian",
  "Grandparent",
  "Other",
] as const;

// ─── Date Helpers ────────────────────────────────────────────────────────────

export const parseYmd = (value: string): Date | null => {
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

export const nameSchema = (label: string) =>
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

export const phoneSchema = () =>
  z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .length(11, "Phone number must be exactly 11 digits.")
    .regex(PH_PHONE_REGEX, "Phone must start with 09 and be 11 digits.");

export const ymdDateSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => parseYmd(value) !== null, {
      message: `${label} must be a valid date.`,
    });

export const numericRangeSchema = (
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

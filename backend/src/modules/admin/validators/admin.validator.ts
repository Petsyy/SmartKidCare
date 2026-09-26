import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const STRICT_EMAIL_REGEX =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const ACCEPTED_EMAIL_DOMAINS = [
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "rocketmail.com",
  "yahoo.com",
  "ymail.com",
  "zoho.com",
];

const usesAcceptedEmailDomain = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";

  return ACCEPTED_EMAIL_DOMAINS.includes(domain);
};

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email cannot exceed 254 characters.")
  .email("Invalid email format.")
  .refine((value) => !/\s/.test(value), "Email cannot contain spaces.")
  .refine(
    (value) => (value.split("@")[0]?.length ?? 0) <= 64,
    "Email address before @ cannot exceed 64 characters.",
  )
  .regex(
    STRICT_EMAIL_REGEX,
    "Email must include a valid domain, such as name@gmail.com.",
  )
  .refine(
    (value) => usesAcceptedEmailDomain(value),
    "Email must use a supported email provider such as Gmail, Yahoo, Outlook, Hotmail, iCloud, Proton, or Zoho.",
  );
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
  firstName: z
    .string()
    .trim()
    .min(2, "First name must contain at least 2 characters.")
    .max(50, "First name cannot exceed 50 characters.")
    .regex(
      /^[A-Za-z][A-Za-z .'-]*$/,
      "First name contains invalid characters.",
    ),
  middleName: z
    .string()
    .trim()
    .min(2, "Middle name must contain at least 2 characters.")
    .max(50, "Middle name cannot exceed 50 characters.")
    .regex(
      /^[A-Za-z][A-Za-z .'-]*$/,
      "Middle name contains invalid characters.",
    ),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must contain at least 2 characters.")
    .max(50, "Last name cannot exceed 50 characters.")
    .regex(/^[A-Za-z][A-Za-z .'-]*$/, "Last name contains invalid characters."),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "Phone number must use the format 09XXXXXXXXX."),
  daycareCenterId: objectIdSchema.optional(),
});

const updateUserProfileSchema = z.object({
  firstName: nonEmptyString,
  middleName: nonEmptyString,
  lastName: nonEmptyString,
  email: emailSchema,
  phone: nonEmptyString,
});

export const validateCreateDaycareCenter = validate(createDaycareCenterSchema);
export const validateUpdateDaycareCenter = validate(updateDaycareCenterSchema);
export const validateGetDaycareCentersQuery = validate(
  getDaycareCentersQuerySchema,
  "query",
);
export const validateCreateTeacher = validate(createTeacherSchema);
export const validateUpdateUserProfile = validate(updateUserProfileSchema);

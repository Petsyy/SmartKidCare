import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  hasLowercaseRegex,
  hasNumberRegex,
  hasSpecialCharacterRegex,
  startsWithUppercaseRegex,
} from "@/utils/password-policy";
import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_OTP_LENGTH,
  noWhitespaceString,
} from "./auth-fields.validation";

export const otpSchema = z
  .string()
  .length(AUTH_OTP_LENGTH, `OTP must be exactly ${AUTH_OTP_LENGTH} digits.`)
  .regex(/^\d+$/, "OTP must contain digits only.");

export const newPasswordSchema = noWhitespaceString(
  "New password",
  AUTH_PASSWORD_MAX_LENGTH,
)
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  )
  .regex(startsWithUppercaseRegex, "Password must start with a capital letter.")
  .regex(hasLowercaseRegex, "Password must include a lowercase letter.")
  .regex(hasNumberRegex, "Password must include a number.")
  .regex(
    hasSpecialCharacterRegex,
    "Password must include at least one special character.",
  );

export const confirmPasswordSchema = noWhitespaceString(
  "Password confirmation",
  AUTH_PASSWORD_MAX_LENGTH,
);

export const captainPasswordSetupSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
    otp: otpSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "New password and confirmation do not match.",
  });

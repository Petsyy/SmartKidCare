import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  hasLowercaseRegex,
  hasNumberRegex,
  hasSpecialCharacterRegex,
  startsWithUppercaseRegex,
} from "@/utils/password-policy";

export const AUTH_USERNAME_MAX_LENGTH = 64;
export const AUTH_LOGIN_IDENTIFIER_MAX_LENGTH = 254;
export const AUTH_PASSWORD_MAX_LENGTH = 128;
export const AUTH_OTP_LENGTH = 6;

export const sanitizeNoWhitespace = (value: string) => value.replace(/\s/g, "");
export const sanitizeOtp = (value: string) =>
  value.replace(/\D/g, "").slice(0, AUTH_OTP_LENGTH);

const noWhitespaceString = (label: string, maximumLength: number) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .max(maximumLength, `${label} must not exceed ${maximumLength} characters.`)
    .refine((value) => !/\s/.test(value), `${label} cannot contain spaces.`);

export const usernameSchema = noWhitespaceString(
  "Username",
  AUTH_USERNAME_MAX_LENGTH,
)
  .min(3, "Username must be at least 3 characters.")
  .regex(/^[A-Za-z]/, "Username must start with a letter.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Username may contain only letters, numbers, periods, underscores, and hyphens.",
  );

export const adminLoginIdentifierSchema = noWhitespaceString(
  "Username or email",
  AUTH_LOGIN_IDENTIFIER_MAX_LENGTH,
).superRefine((value, context) => {
  const isUsername = usernameSchema.safeParse(value).success;
  const isEmail = z.email().safeParse(value).success;

  if (!isUsername && !isEmail) {
    context.addIssue({
      code: "custom",
      message: "Enter a valid username or email address.",
    });
  }
});

export const currentPasswordSchema = noWhitespaceString(
  "Current password",
  AUTH_PASSWORD_MAX_LENGTH,
);

export const loginPasswordSchema = noWhitespaceString(
  "Password",
  AUTH_PASSWORD_MAX_LENGTH,
);

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

export const otpSchema = z
  .string()
  .length(AUTH_OTP_LENGTH, `OTP must be exactly ${AUTH_OTP_LENGTH} digits.`)
  .regex(/^\d+$/, "OTP must contain digits only.");

export const loginCredentialsSchema = z.object({
  username: adminLoginIdentifierSchema,
  password: loginPasswordSchema,
});

export const loginMfaSchema = z.object({ otp: otpSchema });

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

export const passwordChangeRequestSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine((values, context) => {
    if (values.currentPassword === values.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be different from current password.",
      });
    }
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "New password and confirmation do not match.",
      });
    }
  });

export const passwordChangeFormSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
    otp: otpSchema,
  })
  .superRefine((values, context) => {
    if (values.currentPassword === values.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be different from current password.",
      });
    }
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "New password and confirmation do not match.",
      });
    }
  });

export const adminLoginFormSchema = z
  .object({
    flowMode: z.enum(["credentials", "mfa", "passwordSetup"]),
    username: z.string(),
    password: z.string(),
    otp: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const result =
      values.flowMode === "credentials"
        ? loginCredentialsSchema.safeParse(values)
        : values.flowMode === "mfa"
          ? loginMfaSchema.safeParse(values)
          : captainPasswordSetupSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        context.addIssue({
          code: "custom",
          path: issue.path,
          message: issue.message,
        });
      });
    }
  });

export type AdminLoginFormValues = z.infer<typeof adminLoginFormSchema>;
export type PasswordChangeFormValues = z.infer<typeof passwordChangeFormSchema>;

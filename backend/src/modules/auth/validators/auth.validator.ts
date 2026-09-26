import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const emailSchema = z.email("Invalid email format.").trim();
const loginIdentifierSchema = z
  .string()
  .min(1, "Field is required.")
  .max(254, "Login identifier must not exceed 254 characters.")
  .regex(/^\S+$/, "Login identifier cannot contain spaces.");

const usernameLoginSchema = z
  .string()
  .min(1, "Username is required.")
  .min(3, "Username must be at least 3 characters.")
  .max(64, "Username must not exceed 64 characters.")
  .regex(/^\S+$/, "Username cannot contain spaces.")
  .regex(/^[A-Za-z]/, "Username must start with a letter.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Username may contain only letters, numbers, periods, underscores, and hyphens.",
  );

const adminLoginIdentifierSchema = z
  .string()
  .min(1, "Username or email is required.")
  .max(254, "Username or email must not exceed 254 characters.")
  .regex(/^\S+$/, "Username or email cannot contain spaces.")
  .refine(
    (value) =>
      usernameLoginSchema.safeParse(value).success ||
      z.email().safeParse(value).success,
    "Enter a valid username or email address.",
  );

const passwordInputSchema = z
  .string()
  .min(1, "Password is required.")
  .max(128, "Password must not exceed 128 characters.")
  .regex(/^\S+$/, "Password cannot contain spaces.");

const otpInputSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be a 6-digit code.");

const passwordSchema = passwordInputSchema
  .min(8, "Password must be at least 8 characters.")
  .regex(/^[A-Z]/, "Password must start with a capital letter.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/\d/, "Password must include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character.");

const loginSchema = z
  .object({
    email: loginIdentifierSchema.optional(),
    username: adminLoginIdentifierSchema.optional(),
    identifier: loginIdentifierSchema.optional(),
    password: passwordInputSchema,
  })
  .refine((data) => Boolean(data.email || data.username || data.identifier), {
    message: "Email, username, or identifier is required.",
    path: ["email"],
  });

const otpVerifySchema = z.object({
  email: emailSchema,
  otp: otpInputSchema,
});

const adminMfaVerifySchema = z.object({
  mfaToken: nonEmptyString,
  otp: otpInputSchema,
});

const adminMfaResendSchema = z.object({
  mfaToken: nonEmptyString,
});

const emailOnlySchema = z.object({
  email: emailSchema,
});

const passwordSetupSchema = z.object({
  passwordSetupToken: nonEmptyString,
  newPassword: passwordSchema,
});

const captainPasswordSetupSchema = z
  .object({
    passwordSetupToken: nonEmptyString,
    newPassword: passwordSchema,
    confirmPassword: passwordInputSchema,
    otp: otpInputSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const captainPasswordSetupResendSchema = z.object({
  passwordSetupToken: nonEmptyString,
});

const captainInvitationTokenSchema = z.object({
  token: z.string().trim().min(32, "Invitation token is invalid."),
});

const captainActivationSchema = z
  .object({
    token: z.string().trim().min(32, "Invitation token is invalid."),
    newPassword: passwordSchema,
    confirmPassword: passwordInputSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const forgotPasswordResetSchema = z.object({
  passwordResetToken: nonEmptyString,
  newPassword: passwordSchema,
});

const changePasswordSchema = z
  .object({
    currentPassword: passwordInputSchema,
    newPassword: passwordSchema,
    otp: otpInputSchema.optional(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

const changePasswordOtpRequestSchema = z
  .object({
    currentPassword: passwordInputSchema,
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

const updateMeSchema = z
  .object({
    username: nonEmptyString.optional(),
    firstName: nonEmptyString.optional(),
    middleName: z.string().trim().optional(),
    lastName: nonEmptyString.optional(),
    email: emailSchema.optional(),
    phone: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.username !== undefined ||
      data.firstName !== undefined ||
      data.middleName !== undefined ||
      data.lastName !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined,
    {
      message: "At least one field is required.",
    },
  );

const updateAdminPreferencesSchema = z
  .object({
    adminMfaEnabled: z.boolean().optional(),
    adminNotifySecurityEvents: z.boolean().optional(),
    adminNotifySystemUpdates: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.adminMfaEnabled !== undefined ||
      data.adminNotifySecurityEvents !== undefined ||
      data.adminNotifySystemUpdates !== undefined,
    {
      message: "At least one preference is required.",
    },
  );

const getUsersQuerySchema = z.object({
  role: z.enum(["teacher", "parent"]).optional(),
});

export const validateLogin = validate(loginSchema);
export const validateOtpVerify = validate(otpVerifySchema);
export const validateAdminMfaVerify = validate(adminMfaVerifySchema);
export const validateAdminMfaResend = validate(adminMfaResendSchema);
export const validateResendOtp = validate(emailOnlySchema);
export const validatePasswordSetup = validate(passwordSetupSchema);
export const validateCaptainPasswordSetup = validate(captainPasswordSetupSchema);
export const validateCaptainPasswordSetupResend = validate(
  captainPasswordSetupResendSchema,
);
export const validateCaptainInvitationToken = validate(captainInvitationTokenSchema);
export const validateCaptainActivation = validate(captainActivationSchema);
export const validateForgotPasswordRequest = validate(emailOnlySchema);
export const validateForgotPasswordVerify = validate(otpVerifySchema);
export const validateForgotPasswordReset = validate(forgotPasswordResetSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validateChangePasswordOtpRequest = validate(
  changePasswordOtpRequestSchema,
);
export const validateUpdateMe = validate(updateMeSchema);
export const validateAdminPreferences = validate(updateAdminPreferencesSchema);
export const validateGetUsersQuery = validate(getUsersQuerySchema, "query");

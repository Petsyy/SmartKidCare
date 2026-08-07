import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const emailSchema = z.email("Invalid email format.").trim();
const loginIdentifierSchema = z.string().trim().min(1, "Field is required.");

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/^[A-Z]/, "Password must start with a capital letter.")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character.");

const loginSchema = z
  .object({
    email: loginIdentifierSchema.optional(),
    username: loginIdentifierSchema.optional(),
    identifier: loginIdentifierSchema.optional(),
    password: nonEmptyString,
  })
  .refine((data) => Boolean(data.email || data.username || data.identifier), {
    message: "Email, username, or identifier is required.",
    path: ["email"],
  });

const otpVerifySchema = z.object({
  email: emailSchema,
  otp: nonEmptyString,
});

const adminMfaVerifySchema = z.object({
  mfaToken: nonEmptyString,
  otp: nonEmptyString,
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

const forgotPasswordResetSchema = z.object({
  passwordResetToken: nonEmptyString,
  newPassword: passwordSchema,
});

const changePasswordSchema = z
  .object({
    currentPassword: nonEmptyString,
    newPassword: passwordSchema,
    otp: nonEmptyString.optional(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

const changePasswordOtpRequestSchema = z
  .object({
    currentPassword: nonEmptyString,
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
  role: z.enum(["admin", "teacher", "parent"]).optional(),
});

export const validateLogin = validate(loginSchema);
export const validateOtpVerify = validate(otpVerifySchema);
export const validateAdminMfaVerify = validate(adminMfaVerifySchema);
export const validateAdminMfaResend = validate(adminMfaResendSchema);
export const validateResendOtp = validate(emailOnlySchema);
export const validatePasswordSetup = validate(passwordSetupSchema);
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

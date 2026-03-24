import { NextFunction, Request, Response } from "express";
import { z, ZodTypeAny } from "zod";

type RequestPart = "body" | "query";

const validate =
  (schema: ZodTypeAny, part: RequestPart = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[part]);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        message: firstIssue?.message || "Invalid request payload.",
      });
    }

    if (part === "query") {
      const query = req.query as Record<string, unknown>;
      Object.keys(query).forEach((key) => {
        delete query[key];
      });
      Object.assign(query, parsed.data as Record<string, unknown>);
    } else {
      (req as any).body = parsed.data;
    }
    return next();
  };

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const emailSchema = z.email("Invalid email format.").trim();
const loginIdentifierSchema = z.string().trim().min(1, "Field is required.");

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
  newPassword: nonEmptyString,
});

const forgotPasswordResetSchema = z.object({
  passwordResetToken: nonEmptyString,
  newPassword: nonEmptyString,
});

const changePasswordSchema = z.object({
  currentPassword: nonEmptyString,
  newPassword: nonEmptyString,
  otp: nonEmptyString.optional(),
});

const changePasswordOtpRequestSchema = z.object({
  currentPassword: nonEmptyString,
  newPassword: nonEmptyString,
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

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

const loginSchema = z
  .object({
    email: emailSchema.optional(),
    username: nonEmptyString.optional(),
    identifier: nonEmptyString.optional(),
    password: nonEmptyString,
  })
  .refine(
    (data) => Boolean(data.email || data.username || data.identifier),
    {
      message: "Email, username, or identifier is required.",
      path: ["email"],
    },
  );

const otpVerifySchema = z.object({
  email: emailSchema,
  otp: nonEmptyString,
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
});

const getUsersQuerySchema = z.object({
  role: z.enum(["admin", "teacher", "parent"]).optional(),
});

export const validateLogin = validate(loginSchema);
export const validateOtpVerify = validate(otpVerifySchema);
export const validateResendOtp = validate(emailOnlySchema);
export const validatePasswordSetup = validate(passwordSetupSchema);
export const validateForgotPasswordRequest = validate(emailOnlySchema);
export const validateForgotPasswordVerify = validate(otpVerifySchema);
export const validateForgotPasswordReset = validate(forgotPasswordResetSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validateGetUsersQuery = validate(getUsersQuerySchema, "query");

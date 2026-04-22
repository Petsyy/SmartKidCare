import type { Response } from "express";
import { createHash, randomInt } from "crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { IUser } from "../../../models/Users";
import { sendEmail } from "../../notifications/email.service";

const OTP_TTL_MS = 10 * 60 * 1000;
const SETUP_TOKEN_TTL = "15m";
const RESET_TOKEN_TTL = "15m";

export const TEACHER_PASSWORD_SETUP_PURPOSE = "teacher_password_setup";
export const PARENT_PASSWORD_SETUP_PURPOSE = "parent_password_setup";
export const FORGOT_PASSWORD_OTP_PURPOSE = "forgot_password_otp";
export const FORGOT_PASSWORD_RESET_TOKEN_PURPOSE = "forgot_password_reset";
export const CHANGE_PASSWORD_OTP_PURPOSE = "change_password_otp";

const PASSWORD_MIN_LENGTH = 8;
const startsWithUppercaseRegex = /^[A-Z]/;
const hasSpecialCharacterRegex = /[^A-Za-z0-9]/;

const getAuthTokenTtl = (): SignOptions["expiresIn"] => {
  const raw = String(process.env.AUTH_TOKEN_TTL || "").trim();
  if (!raw) {
    return "1d";
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  return raw as unknown as SignOptions["expiresIn"];
};

const AUTH_TOKEN_TTL = getAuthTokenTtl();

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const hashOtp = (otp: string) =>
  createHash("sha256")
    .update(`${otp}:${process.env.OTP_SECRET || getJwtSecret()}`)
    .digest("hex");

export const validatePasswordPolicy = (password: string): string | null => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!startsWithUppercaseRegex.test(password)) {
    return "Password must start with a capital letter.";
  }

  if (!hasSpecialCharacterRegex.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
};

export const signAuthToken = (userId: string, role: string) =>
  jwt.sign({ id: userId, role }, getJwtSecret(), { expiresIn: AUTH_TOKEN_TTL });

export const buildPasswordSetupToken = (userId: string, purpose: string) =>
  jwt.sign({ id: userId, purpose }, getJwtSecret(), {
    expiresIn: SETUP_TOKEN_TTL,
  });

export const buildPasswordResetToken = (userId: string) =>
  jwt.sign(
    { id: userId, purpose: FORGOT_PASSWORD_RESET_TOKEN_PURPOSE },
    getJwtSecret(),
    { expiresIn: RESET_TOKEN_TTL },
  );

export const issuePasswordOtp = async (
  user: IUser,
  purpose: string,
  subject: string,
  introText: string,
) => {
  const otp = randomInt(100000, 1000000).toString();

  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.passwordResetOtpPurpose = purpose;
  await user.save();

  await sendEmail({
    to: user.email,
    subject,
    text: `${introText} ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Smart KidCare</h1>
          </div>
          <div style="padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f766e;">Verification Code</h2>
            <p style="color: #64748b; margin-bottom: 32px; font-size: 16px;">${introText}</p>
            <div style="background: #f0fdfa; border-radius: 12px; padding: 24px; display: inline-block; border: 1px solid #ccfbf1;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; color: #0d9488; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="margin-top: 32px; font-size: 14px; color: #94a3b8;">This code will expire in <span style="font-weight: 600; color: #475569;">10 minutes</span>.</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">If you didn't request this code, you can safely ignore this email.</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Smart KidCare. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  });
};

export const mapOtpDeliveryError = (error: unknown): string => {
  const code = String((error as { code?: string })?.code || "").toUpperCase();
  const message = String((error as { message?: string })?.message || "");
  const lowerMessage = message.toLowerCase();

  if (message.includes("Email service misconfigured")) {
    return message;
  }

  if (code === "EAUTH" || lowerMessage.includes("invalid login")) {
    return "SMTP authentication failed. Check SMTP_USER and SMTP_PASS.";
  }

  if (
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND"
  ) {
    return "Cannot connect to SMTP server. Check SMTP_HOST/SMTP_PORT/SMTP_SECURE and internet access.";
  }

  return "Unable to send OTP right now. Please try again.";
};

export const maybeRequireTeacherPasswordChange = async (
  user: IUser,
  res: Response,
): Promise<boolean> => {
  if (user.role !== "teacher" || !user.mustChangePassword) {
    return false;
  }

  try {
    await issuePasswordOtp(
      user,
      TEACHER_PASSWORD_SETUP_PURPOSE,
      "SmartKidCare password setup OTP",
      "Your SmartKidCare OTP is:",
    );
  } catch (error: unknown) {
    res.status(500).json({
      message: mapOtpDeliveryError(error),
    });
    return true;
  }

  res.json({
    requiresPasswordChange: true,
    email: user.email,
    message: "OTP sent to your email.",
  });
  return true;
};

export const maybeRequireParentPasswordChange = async (
  user: IUser,
  res: Response,
): Promise<boolean> => {
  if (user.role !== "parent" || !user.mustChangePassword) {
    return false;
  }

  const passwordSetupToken = buildPasswordSetupToken(
    String(user._id),
    PARENT_PASSWORD_SETUP_PURPOSE,
  );

  res.json({
    requiresPasswordChange: true,
    requiresOtp: false,
    email: user.email,
    passwordSetupToken,
    message: "Please set a new password to continue.",
  });
  return true;
};

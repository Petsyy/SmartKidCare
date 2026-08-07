import { createHash, randomInt } from "crypto";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { IUser } from "../../../models/Users";
import { sendEmail } from "../../notifications/services/email.service";
import { setCsrfCookie } from "../../../shared/lib/csrf";
import { getAuthCookieOptions } from "../../../shared/lib/cookies";

export const ADMIN_LOGIN_MFA_PURPOSE = "admin_login_mfa";

const ADMIN_LOGIN_MFA_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const ADMIN_LOGIN_MFA_TOKEN_TTL = "15m";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

export const hashAdminLoginOtp = (otp: string) =>
  createHash("sha256")
    .update(`${otp}:${process.env.OTP_SECRET || getJwtSecret()}`)
    .digest("hex");

export const clearAdminLoginOtp = async (user: IUser) => {
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.passwordResetOtpPurpose = undefined;
  await user.save();
};

export const setAdminAuthCookie = (res: Response, token: string) => {
  res.cookie("authToken", token, getAuthCookieOptions());

  setCsrfCookie(res, token);
};

export const maskEmail = (email: string) => {
  const [localPart = "", domainPart = ""] = String(email).split("@");
  if (!domainPart || localPart.length < 2) {
    return email;
  }

  const maskedLocal =
    localPart[0] +
    "*".repeat(Math.max(localPart.length - 2, 1)) +
    localPart.slice(-1);
  return `${maskedLocal}@${domainPart}`;
};

export const mapOtpDeliveryError = (error: any): string => {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "");
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

export const issueAdminLoginOtp = async (user: IUser): Promise<string> => {
  const otp = randomInt(100000, 1000000).toString();

  user.passwordResetOtpHash = hashAdminLoginOtp(otp);
  user.passwordResetOtpExpiresAt = new Date(
    Date.now() + ADMIN_LOGIN_MFA_OTP_TTL_MS,
  );
  user.passwordResetOtpPurpose = ADMIN_LOGIN_MFA_PURPOSE;
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "SmartKidCare admin login verification code",
      text: `Your SmartKidCare admin login OTP is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Smart KidCare</h1>
            </div>
            <div style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f766e;">Verification Code</h2>
              <p style="color: #64748b; margin-bottom: 32px; font-size: 16px;">Please use the following verification code to complete your admin login.</p>
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
  } catch (error) {
    await clearAdminLoginOtp(user);
    throw error;
  }

  return jwt.sign(
    { id: String(user._id), purpose: ADMIN_LOGIN_MFA_PURPOSE },
    getJwtSecret(),
    { expiresIn: ADMIN_LOGIN_MFA_TOKEN_TTL },
  );
};

export const verifyAdminMfaToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "string") {
      return null;
    }

    if (decoded.purpose !== ADMIN_LOGIN_MFA_PURPOSE || !decoded.id) {
      return null;
    }

    return String(decoded.id);
  } catch {
    return null;
  }
};

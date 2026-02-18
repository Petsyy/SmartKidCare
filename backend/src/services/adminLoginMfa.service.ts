import { createHash, randomInt } from "crypto";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { IUser } from "../models/Users";
import { sendEmail } from "./email.service";

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
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
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
  user.passwordResetOtpExpiresAt = new Date(Date.now() + ADMIN_LOGIN_MFA_OTP_TTL_MS);
  user.passwordResetOtpPurpose = ADMIN_LOGIN_MFA_PURPOSE;
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "SmartKidCare admin login verification code",
      text: `Your SmartKidCare admin login OTP is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>Your SmartKidCare admin login OTP is:</p>
          <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${otp}</p>
          <p>This code expires in 10 minutes.</p>
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

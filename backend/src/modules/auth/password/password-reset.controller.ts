import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";
import {
  buildPasswordResetToken,
  escapeRegex,
  FORGOT_PASSWORD_OTP_PURPOSE,
  FORGOT_PASSWORD_RESET_TOKEN_PURPOSE,
  getJwtSecret,
  hashOtp,
  issuePasswordOtp,
  mapOtpDeliveryError,
  validatePasswordPolicy,
} from "./password.shared";

const findActiveTeacherByEmail = async (email: string) => {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;

  const exact = await User.findOne({
    email: normalized,
    role: "teacher",
    isActive: true,
  });
  if (exact) return exact;

  return User.findOne({
    email: {
      $regex: `^${escapeRegex(normalized)}$`,
      $options: "i",
    },
    role: "teacher",
    isActive: true,
  });
};

export const requestForgotPasswordOtp = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await findActiveTeacherByEmail(normalizedEmail);

    if (user) {
      void issuePasswordOtp(
        user,
        FORGOT_PASSWORD_OTP_PURPOSE,
        "SmartKidCare forgot-password OTP",
        "Use this OTP to reset your SmartKidCare password:",
      ).catch(() => {
        return;
      });
    }

    return res.json({
      message: "If the account exists, an OTP has been sent to the email.",
    });
  } catch (error: unknown) {
    return res.status(500).json({ message: mapOtpDeliveryError(error) });
  }
};

export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim();
    const normalizedOtp = String(otp || "").trim();

    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await findActiveTeacherByEmail(normalizedEmail);

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP request." });
    }

    if (
      user.passwordResetOtpPurpose !== FORGOT_PASSWORD_OTP_PURPOSE ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt
    ) {
      return res
        .status(400)
        .json({ message: "No OTP found. Request a new one." });
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      user.passwordResetOtpPurpose = undefined;
      await user.save();

      return res
        .status(400)
        .json({ message: "OTP expired. Request a new code." });
    }

    if (hashOtp(normalizedOtp) !== user.passwordResetOtpHash) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpPurpose = undefined;
    await user.save();

    const passwordResetToken = buildPasswordResetToken(String(user._id));

    return res.json({
      message: "OTP verified.",
      passwordResetToken,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const resetForgotPassword = async (req: Request, res: Response) => {
  try {
    const { passwordResetToken, newPassword } = req.body;

    if (!passwordResetToken || !newPassword) {
      return res.status(400).json({
        message: "Password reset token and new password are required.",
      });
    }

    const passwordValidationError = validatePasswordPolicy(String(newPassword));
    if (passwordValidationError) {
      return res.status(400).json({ message: passwordValidationError });
    }

    let decoded: jwt.JwtPayload | string;
    try {
      decoded = jwt.verify(String(passwordResetToken), getJwtSecret());
    } catch {
      return res.status(401).json({ message: "Invalid or expired reset token." });
    }

    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid reset token." });
    }

    if (
      decoded.purpose !== FORGOT_PASSWORD_RESET_TOKEN_PURPOSE ||
      !decoded.id
    ) {
      return res.status(401).json({ message: "Invalid reset token." });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== "teacher") {
      return res.status(404).json({ message: "User account not found." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    user.mustChangePassword = false;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpPurpose = undefined;
    user.latestTempPassword = undefined;
    user.latestTempPasswordIssuedAt = undefined;
    await user.save();

    return res.json({ message: "Password reset successful." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";
import {
  CHANGE_PASSWORD_OTP_PURPOSE,
  FORGOT_PASSWORD_OTP_PURPOSE,
  FORGOT_PASSWORD_RESET_TOKEN_PURPOSE,
  PARENT_PASSWORD_SETUP_PURPOSE,
  TEACHER_PASSWORD_SETUP_PURPOSE,
  buildPasswordResetToken,
  buildPasswordSetupToken,
  escapeRegex,
  getJwtSecret,
  hashOtp,
  issuePasswordOtp,
  mapOtpDeliveryError,
  signAuthToken,
  maybeRequireParentPasswordChange,
  maybeRequireTeacherPasswordChange,
} from "../services/password-otp.service";

export {
  maybeRequireParentPasswordChange,
  maybeRequireTeacherPasswordChange,
};

// --- Password Setup ---

export const verifyTeacherPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email).trim();
    const normalizedOtp = String(otp).trim();

    const user = await User.findOne({
      email: {
        $regex: `^${escapeRegex(normalizedEmail)}$`,
        $options: "i",
      },
      role: "teacher",
      mustChangePassword: true,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP request." });
    }

    if (
      user.passwordResetOtpPurpose !== TEACHER_PASSWORD_SETUP_PURPOSE ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt
    ) {
      return res.status(400).json({ message: "No OTP found. Log in again." });
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

    const passwordSetupToken = buildPasswordSetupToken(
      String(user._id),
      TEACHER_PASSWORD_SETUP_PURPOSE,
    );

    res.json({
      message: "OTP verified.",
      passwordSetupToken,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const resendTeacherPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email).trim();

    const user = await User.findOne({
      email: {
        $regex: `^${escapeRegex(normalizedEmail)}$`,
        $options: "i",
      },
      role: "teacher",
      mustChangePassword: true,
      isActive: true,
    });

    if (user) {
      await issuePasswordOtp(
        user,
        TEACHER_PASSWORD_SETUP_PURPOSE,
        "SmartKidCare password setup OTP",
        "Your SmartKidCare OTP is:",
      );
    }

    res.json({ message: "If the account is eligible, OTP was sent." });
  } catch (error: unknown) {
    res.status(500).json({ message: mapOtpDeliveryError(error) });
  }
};

export const completeTeacherPasswordSetup = async (req: Request, res: Response) => {
  try {
    const { passwordSetupToken, newPassword } = req.body;

    let decoded: jwt.JwtPayload | string;
    try {
      decoded = jwt.verify(String(passwordSetupToken), getJwtSecret());
    } catch {
      return res.status(401).json({ message: "Invalid or expired setup token." });
    }

    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid setup token." });
    }

    if (
      decoded.purpose !== TEACHER_PASSWORD_SETUP_PURPOSE &&
      decoded.purpose !== PARENT_PASSWORD_SETUP_PURPOSE
    ) {
      return res.status(401).json({ message: "Invalid setup token." });
    }

    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid setup token." });
    }

    const user = await User.findById(decoded.id);
    if (!user || (user.role !== "teacher" && user.role !== "parent")) {
      return res.status(404).json({ message: "User account not found." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    if (!user.mustChangePassword) {
      return res
        .status(400)
        .json({ message: "Password setup already completed." });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    user.mustChangePassword = false;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpPurpose = undefined;
    user.latestTempPassword = undefined;
    user.latestTempPasswordIssuedAt = undefined;
    await user.save();

    const token = signAuthToken(String(user._id), user.role);

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.json({
      message: "Password updated successfully.",
      token,
      user: userResponse,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Forgot Password ---

const findActiveTeacherByEmail = async (email: string) => {
  const normalized = String(email)
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

export const requestForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email).trim();

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

export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email).trim();
    const normalizedOtp = String(otp).trim();

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

// --- Change Password ---

export const requestChangePasswordOtp = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Two-factor password confirmation is available for admins only.",
      });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    await issuePasswordOtp(
      user,
      CHANGE_PASSWORD_OTP_PURPOSE,
      "SmartKidCare password change OTP",
      "Use this OTP to confirm your SmartKidCare password change:",
    );

    return res.status(202).json({
      requiresTwoFactor: true,
      message: "OTP sent to your email.",
    });
  } catch (error: unknown) {
    return res.status(500).json({ message: mapOtpDeliveryError(error) });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const { currentPassword, newPassword, otp } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(
      String(currentPassword),
      user.password,
    );
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    if (user.role === "admin") {
      const normalizedOtp = String(otp || "").trim();
      if (!normalizedOtp) {
        return res.status(400).json({
          message:
            "OTP is required. Request an OTP first, then verify it to continue.",
        });
      }

      if (
        user.passwordResetOtpPurpose !== CHANGE_PASSWORD_OTP_PURPOSE ||
        !user.passwordResetOtpHash ||
        !user.passwordResetOtpExpiresAt
      ) {
        return res.status(400).json({
          message: "No OTP found. Request a new code.",
        });
      }

      if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpiresAt = undefined;
        user.passwordResetOtpPurpose = undefined;
        await user.save();

        return res.status(400).json({
          message: "OTP expired. Request a new code.",
        });
      }

      if (hashOtp(normalizedOtp) !== user.passwordResetOtpHash) {
        return res.status(400).json({ message: "Invalid OTP." });
      }
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    user.mustChangePassword = false;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpPurpose = undefined;
    user.latestTempPassword = undefined;
    user.latestTempPasswordIssuedAt = undefined;
    await user.save();

    return res.json({ message: "Password changed successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

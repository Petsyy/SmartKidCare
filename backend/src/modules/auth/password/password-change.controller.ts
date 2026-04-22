import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../../../models/Users";
import {
  CHANGE_PASSWORD_OTP_PURPOSE,
  hashOtp,
  issuePasswordOtp,
  mapOtpDeliveryError,
  validatePasswordPolicy,
} from "./password.shared";

export const requestChangePasswordOtp = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (String(currentPassword) === String(newPassword)) {
      return res.status(400).json({
        message: "New password must be different from current password.",
      });
    }

    const passwordValidationError = validatePasswordPolicy(String(newPassword));
    if (passwordValidationError) {
      return res.status(400).json({ message: passwordValidationError });
    }

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
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (String(currentPassword) === String(newPassword)) {
      return res.status(400).json({
        message: "New password must be different from current password.",
      });
    }

    const passwordValidationError = validatePasswordPolicy(String(newPassword));
    if (passwordValidationError) {
      return res.status(400).json({ message: passwordValidationError });
    }

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

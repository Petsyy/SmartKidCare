import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";
import {
  buildPasswordSetupToken,
  escapeRegex,
  getJwtSecret,
  hashOtp,
  mapOtpDeliveryError,
  maybeRequireParentPasswordChange,
  maybeRequireTeacherPasswordChange,
  PARENT_PASSWORD_SETUP_PURPOSE,
  TEACHER_PASSWORD_SETUP_PURPOSE,
  issuePasswordOtp,
  signAuthToken,
  validatePasswordPolicy,
} from "./password.shared";

export {
  maybeRequireParentPasswordChange,
  maybeRequireTeacherPasswordChange,
  signAuthToken,
} from "./password.shared";

export const verifyTeacherPasswordOtp = async (
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

export const resendTeacherPasswordOtp = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

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

export const completeTeacherPasswordSetup = async (
  req: Request,
  res: Response,
) => {
  try {
    const { passwordSetupToken, newPassword } = req.body;

    if (!passwordSetupToken || !newPassword) {
      return res.status(400).json({
        message: "Password setup token and new password are required.",
      });
    }

    const passwordValidationError = validatePasswordPolicy(String(newPassword));
    if (passwordValidationError) {
      return res.status(400).json({ message: passwordValidationError });
    }

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

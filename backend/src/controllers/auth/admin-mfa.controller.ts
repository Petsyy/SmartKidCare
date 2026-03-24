import { Request, Response } from "express";
import User from "../../models/Users";
import { signAuthToken } from "./password.controller";
import {
  ADMIN_LOGIN_MFA_PURPOSE,
  clearAdminLoginOtp,
  hashAdminLoginOtp,
  issueAdminLoginOtp,
  mapOtpDeliveryError,
  maskEmail,
  setAdminAuthCookie,
  verifyAdminMfaToken,
} from "../../services/auth/adminLoginMfa.service";

export const verifyAdminLoginMfa = async (req: Request, res: Response) => {
  try {
    const { mfaToken, otp } = req.body;
    const normalizedToken = String(mfaToken || "").trim();
    const normalizedOtp = String(otp || "").trim();

    if (!normalizedToken || !normalizedOtp) {
      return res
        .status(400)
        .json({ message: "MFA token and OTP are required." });
    }

    const userId = verifyAdminMfaToken(normalizedToken);
    if (!userId) {
      return res.status(401).json({ message: "Invalid or expired MFA token." });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(404).json({ message: "Admin account not found." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    if (
      user.passwordResetOtpPurpose !== ADMIN_LOGIN_MFA_PURPOSE ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt
    ) {
      return res.status(400).json({ message: "No OTP found. Log in again." });
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      await clearAdminLoginOtp(user);
      return res.status(400).json({ message: "OTP expired. Log in again." });
    }

    if (hashAdminLoginOtp(normalizedOtp) !== user.passwordResetOtpHash) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    await clearAdminLoginOtp(user);

    const token = signAuthToken(String(user._id), user.role);
    setAdminAuthCookie(res, token);

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return res.json({ user: userResponse });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const resendAdminLoginMfa = async (req: Request, res: Response) => {
  try {
    const { mfaToken } = req.body;
    const normalizedToken = String(mfaToken || "").trim();
    if (!normalizedToken) {
      return res.status(400).json({ message: "MFA token is required." });
    }

    const userId = verifyAdminMfaToken(normalizedToken);
    if (!userId) {
      return res.status(401).json({ message: "Invalid or expired MFA token." });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(404).json({ message: "Admin account not found." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    const nextMfaToken = await issueAdminLoginOtp(user);
    return res.json({
      mfaToken: nextMfaToken,
      email: maskEmail(user.email),
      message: "A new OTP has been sent.",
    });
  } catch (error: any) {
    console.error("Admin login OTP resend failed:", {
      code: error?.code,
      message: error?.message,
    });

    return res.status(500).json({ message: mapOtpDeliveryError(error) });
  }
};

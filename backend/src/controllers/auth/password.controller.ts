import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomInt } from "crypto";
import User, { IUser } from "../../models/Users";
import { sendEmail } from "../../services/notifications/email.service";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SETUP_TOKEN_TTL = "15m";
const RESET_TOKEN_TTL = "15m";

const TEACHER_PASSWORD_SETUP_PURPOSE = "teacher_password_setup";
const PARENT_PASSWORD_SETUP_PURPOSE = "parent_password_setup";
const FORGOT_PASSWORD_OTP_PURPOSE = "forgot_password_otp";
const FORGOT_PASSWORD_RESET_TOKEN_PURPOSE = "forgot_password_reset";
const CHANGE_PASSWORD_OTP_PURPOSE = "change_password_otp";

const PASSWORD_MIN_LENGTH = 8;
const startsWithUppercaseRegex = /^[A-Z]/;
const hasSpecialCharacterRegex = /[^A-Za-z0-9]/;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findActiveTeacherByEmail = async (email: string) => {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;

  // Fast path: exact match can use the unique index on email.
  const exact = await User.findOne({
    email: normalized,
    role: "teacher",
    isActive: true,
  });
  if (exact) return exact;

  // Backward compatibility for legacy mixed-case emails.
  return User.findOne({
    email: {
      $regex: `^${escapeRegex(normalized)}$`,
      $options: "i",
    },
    role: "teacher",
    isActive: true,
  });
};

const hashOtp = (otp: string) =>
  createHash("sha256")
    .update(`${otp}:${process.env.OTP_SECRET || getJwtSecret()}`)
    .digest("hex");

const validatePasswordPolicy = (password: string): string | null => {
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
  jwt.sign({ id: userId, role }, getJwtSecret(), { expiresIn: "1d" });

const issuePasswordOtp = async (
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

const mapOtpDeliveryError = (error: any): string => {
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
  } catch (error: any) {
    console.error("Teacher OTP send failed:", {
      email: user.email,
      code: error?.code,
      message: error?.message,
    });

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

  const passwordSetupToken = jwt.sign(
    { id: user._id, purpose: PARENT_PASSWORD_SETUP_PURPOSE },
    getJwtSecret(),
    { expiresIn: SETUP_TOKEN_TTL },
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

export const verifyTeacherPasswordOtp = async (req: Request, res: Response) => {
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

    const passwordSetupToken = jwt.sign(
      { id: user._id, purpose: TEACHER_PASSWORD_SETUP_PURPOSE },
      getJwtSecret(),
      { expiresIn: SETUP_TOKEN_TTL },
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
  } catch (error: any) {
    console.error("Teacher OTP resend failed:", {
      code: error?.code,
      message: error?.message,
    });

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
      return res
        .status(401)
        .json({ message: "Invalid or expired setup token." });
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
    if (
      !user ||
      (user.role !== "teacher" && user.role !== "parent")
    ) {
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

export const requestForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await findActiveTeacherByEmail(normalizedEmail);

    if (user) {
      // Do not block the response on SMTP latency; render can be slow to deliver mail.
      void issuePasswordOtp(
        user,
        FORGOT_PASSWORD_OTP_PURPOSE,
        "SmartKidCare forgot-password OTP",
        "Use this OTP to reset your SmartKidCare password:",
      ).catch((error: any) => {
        console.error("Forgot-password OTP background send failed:", {
          email: user.email,
          code: error?.code,
          message: error?.message,
        });
      });
    }

    return res.json({
      message: "If the account exists, an OTP has been sent to the email.",
    });
  } catch (error: any) {
    console.error("Forgot-password OTP request failed:", {
      code: error?.code,
      message: error?.message,
    });

    return res.status(500).json({ message: mapOtpDeliveryError(error) });
  }
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
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

    const passwordResetToken = jwt.sign(
      { id: user._id, purpose: FORGOT_PASSWORD_RESET_TOKEN_PURPOSE },
      getJwtSecret(),
      { expiresIn: RESET_TOKEN_TTL },
    );

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
      return res
        .status(401)
        .json({ message: "Invalid or expired reset token." });
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
    await user.save();

    return res.json({ message: "Password reset successful." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

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
  } catch (error: any) {
    console.error("Change-password OTP request failed:", {
      code: error?.code,
      message: error?.message,
    });

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
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
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
    await user.save();

    return res.json({ message: "Password changed successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

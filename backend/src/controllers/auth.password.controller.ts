import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomInt } from "crypto";
import User, { IUser } from "../models/Users";
import { sendEmail } from "../services/email.service";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const PASSWORD_SETUP_TOKEN_TTL = "15m";
const TEACHER_PASSWORD_SETUP_PURPOSE = "teacher_password_setup";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hashOtp = (otp: string) =>
  createHash("sha256")
    .update(`${otp}:${process.env.OTP_SECRET || getJwtSecret()}`)
    .digest("hex");

export const signAuthToken = (userId: string, role: string) =>
  jwt.sign({ id: userId, role }, getJwtSecret(), { expiresIn: "1d" });

const issueTeacherPasswordOtp = async (user: IUser) => {
  const otp = randomInt(100000, 1000000).toString();

  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "SmartKidCare password reset OTP",
    text: `Your SmartKidCare OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>Your SmartKidCare OTP is:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
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
    await issueTeacherPasswordOtp(user);
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

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ message: "No OTP found. Log in again." });
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
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
    await user.save();

    const passwordSetupToken = jwt.sign(
      { id: user._id, purpose: TEACHER_PASSWORD_SETUP_PURPOSE },
      getJwtSecret(),
      { expiresIn: PASSWORD_SETUP_TOKEN_TTL },
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
      await issueTeacherPasswordOtp(user);
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

    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
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

    if (decoded.purpose !== TEACHER_PASSWORD_SETUP_PURPOSE || !decoded.id) {
      return res.status(401).json({ message: "Invalid setup token." });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== "teacher") {
      return res.status(404).json({ message: "Teacher account not found." });
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

export const changePassword = async (req: Request, res: Response) => {
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

    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    user.mustChangePassword = false;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

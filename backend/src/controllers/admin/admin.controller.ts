import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../../models/Users";
import Child from "../../models/Child";
import ChildEnrollmentRequest from "../../models/ChildEnrollmentRequest";
import AuditLog from "../../models/AuditLog";
import ChildDevelopmentCenter from "../../models/ChildDevelopmentCenter";
import { checkMailerHealth } from "../../lib/mailer";
import { sendEmail } from "../../services/notifications/email.service";
import {
  isValidEmailAddress,
  mapCredentialDeliveryError,
  sendTeacherCredentialsEmail,
} from "../../services/notifications/teacherCredentials.service";

const normalizeOptionalString = (value: unknown): string | undefined => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
};

const parseBooleanFlag = (value: unknown): boolean => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

const isSmtpHealthEndpointEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  parseBooleanFlag(process.env.ENABLE_SMTP_HEALTH);

export const createTeacher = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only" });
    }

    const { firstName, middleName, lastName, email, phone, daycareCenterId } =
      req.body;

    if (
      !firstName ||
      !middleName ||
      !lastName ||
      !email ||
      !phone ||
      !daycareCenterId
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(String(daycareCenterId))) {
      return res.status(400).json({ message: "Invalid center selected." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!isValidEmailAddress(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email." });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const daycareCenter = await ChildDevelopmentCenter.findById(daycareCenterId)
      .select("_id name barangay isActive")
      .lean();
    if (!daycareCenter || daycareCenter.isActive === false) {
      return res.status(404).json({ message: "Selected center not found." });
    }

    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const teacher = await User.create({
      firstName,
      middleName,
      lastName,
      email: normalizedEmail,
      phone,
      daycareCenter: daycareCenter._id,
      password: hashedPassword,
      role: "teacher",
      mustChangePassword: true,
      passwordResetOtpHash: undefined,
      passwordResetOtpExpiresAt: undefined,
      latestTempPassword: tempPassword,
      latestTempPasswordIssuedAt: new Date(),
    });

    let emailDelivery: { sent: boolean; to: string; message?: string } = {
      sent: true,
      to: normalizedEmail,
    };
    try {
      await sendTeacherCredentialsEmail({
        to: normalizedEmail,
        firstName: teacher.firstName,
        tempPassword,
      });
    } catch (error: any) {
      const deliveryErrorMessage = mapCredentialDeliveryError(error);
      console.error("Teacher credentials email delivery failed:", {
        teacherId: teacher._id,
        email: normalizedEmail,
        code: error?.code,
        message: error?.message,
      });
      emailDelivery = {
        sent: false,
        to: normalizedEmail,
        message: deliveryErrorMessage,
      };
    }

    const teacherResponse = teacher.toObject() as any;
    delete (teacherResponse as any).password;
    teacherResponse.daycareCenterId = String(daycareCenter._id);
    teacherResponse.daycareCenter = daycareCenter;

    res.status(201).json({
      teacher: teacherResponse,
      credentials: {
        email: normalizedEmail,
        tempPassword,
      },
      emailDelivery,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const userId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const { firstName, middleName, lastName, email, phone, daycareCenterId } =
      req.body;

    if (!firstName || !middleName || !lastName || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
    });

    if (existing) {
      return res.status(409).json({ message: "Email already in use." });
    }

    let nextDaycareCenterId: mongoose.Types.ObjectId | undefined;
    if (daycareCenterId !== undefined && daycareCenterId !== null && String(daycareCenterId).trim()) {
      if (!mongoose.Types.ObjectId.isValid(String(daycareCenterId))) {
        return res.status(400).json({ message: "Invalid center selected." });
      }

      const daycareCenter = await ChildDevelopmentCenter.findById(daycareCenterId)
        .select("_id")
        .lean();
      if (!daycareCenter) {
        return res.status(404).json({ message: "Selected center not found." });
      }
      nextDaycareCenterId = daycareCenter._id as mongoose.Types.ObjectId;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        middleName,
        lastName,
        email: normalizedEmail,
        phone,
        ...(nextDaycareCenterId !== undefined ? { daycareCenter: nextDaycareCenterId } : {}),
      },
      { new: true },
    )
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (nextDaycareCenterId !== undefined && (user as any).role === "teacher") {
      await Child.updateMany(
        { teacher: user._id },
        { $set: { daycareCenter: nextDaycareCenterId } },
      );
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    user.password = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpPurpose = undefined;
    user.latestTempPassword = tempPassword;
    user.latestTempPasswordIssuedAt = new Date();

    await user.save();

    res.json({
      credentials: {
        email: user.email,
        tempPassword,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ isActive: user.isActive });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const user = await User.findById(req.params.id).select("role email");
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.role === "parent") {
      await Promise.all([
        Child.updateMany(
          { parent: user._id },
          {
            $set: { parent: null },
          },
        ),
        ChildEnrollmentRequest.deleteMany({
          "parent.email": user.email,
        }),
      ]);
    }

    if (user.role === "teacher") {
      const [linkedChildrenCount, linkedRequestsCount] = await Promise.all([
        Child.countDocuments({ teacher: user._id }),
        ChildEnrollmentRequest.countDocuments({
          requestedBy: user._id,
        }),
      ]);

      if (linkedChildrenCount > 0 || linkedRequestsCount > 0) {
        return res.status(409).json({
          message:
            "Cannot delete this teacher account because it has linked child records or enrollment requests. Deactivate the account instead.",
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getParentChildren = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    const parent = await User.findById(req.params.parentId)
      .select("email")
      .lean();

    if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    }

    const [children, requests] = await Promise.all([
      Child.find({ parent: req.params.parentId })
        .sort({ createdAt: -1 })
        .lean(),
      ChildEnrollmentRequest.find({
        "parent.email": parent.email,
        createdChild: null,
      })
        .select("status child createdAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.json({ children, requests });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getDaycareCenters = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const barangay = normalizeOptionalString(req.query.barangay);
    const query: Record<string, unknown> = {};
    if (barangay) {
      query.barangay = barangay;
    }

    const centers = await ChildDevelopmentCenter.find(query)
      .sort({ barangay: 1, name: 1 })
      .lean();

    return res.json({ centers });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createDaycareCenter = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const name = String(req.body?.name ?? "").trim();
    const barangay = String(req.body?.barangay ?? "").trim();
    const code = String(req.body?.code ?? "").trim().toUpperCase();
    const address = String(req.body?.address ?? "").trim();

    if (!name || !barangay || !code) {
      return res.status(400).json({ message: "Name, barangay, and code are required." });
    }

    const existing = await ChildDevelopmentCenter.findOne({ code }).select("_id").lean();
    if (existing) {
      return res.status(409).json({ message: "Center code already exists." });
    }

    const center = await ChildDevelopmentCenter.create({
      name,
      barangay,
      code,
      address,
      isActive: req.body?.isActive !== false,
    });

    return res.status(201).json({ center });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateDaycareCenter = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const updates: Record<string, unknown> = {};
    if (req.body?.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body?.barangay !== undefined) updates.barangay = String(req.body.barangay).trim();
    if (req.body?.address !== undefined) updates.address = String(req.body.address).trim();
    if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

    const center = await ChildDevelopmentCenter.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true },
    );

    if (!center) {
      return res.status(404).json({ message: "Center not found." });
    }

    return res.json({ center });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const actorId = String(req.query.actorId ?? "").trim();
    const method = String(req.query.method ?? "").trim().toUpperCase();
    const successRaw = String(req.query.success ?? "").trim().toLowerCase();
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    const query: Record<string, unknown> = {};

    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      query.actorId = new mongoose.Types.ObjectId(actorId);
    }

    if (method) {
      query.method = method;
    }

    if (successRaw === "true" || successRaw === "false") {
      query.success = successRaw === "true";
    }

    if (from || to) {
      const createdAtRange: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) createdAtRange.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) createdAtRange.$lte = toDate;
      }
      if (Object.keys(createdAtRange).length > 0) {
        query.createdAt = createdAtRange;
      }
    }

    const [items, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: String(error?.message || error) });
  }
};

export const getSmtpHealth = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    if (!isSmtpHealthEndpointEnabled()) {
      return res.status(404).json({ message: "Not found" });
    }

    const health = await checkMailerHealth();
    const shouldSendTestEmail = parseBooleanFlag(req.query.sendTest);

    let sendTest:
      | {
          attempted: false;
        }
      | {
          attempted: true;
          ok: boolean;
          to: string;
          messageId?: string;
          rejected?: string[];
          error?: {
            code?: string;
            responseCode?: number;
            message: string;
          };
        } = { attempted: false };

    if (shouldSendTestEmail) {
      const targetEmail = String(
        req.query.to || process.env.SMTP_USER || "",
      ).trim();

      if (!targetEmail) {
        sendTest = {
          attempted: true,
          ok: false,
          to: "",
          error: {
            message: "Missing test recipient. Provide ?to=<email> or SMTP_USER.",
          },
        };
      } else {
        try {
          const info: any = await sendEmail({
            to: targetEmail,
            subject: "SmartKidCare SMTP health test",
            text: `SMTP health check succeeded at ${new Date().toISOString()}.`,
          });

          sendTest = {
            attempted: true,
            ok: true,
            to: targetEmail,
            messageId: String(info?.messageId || ""),
            rejected: Array.isArray(info?.rejected)
              ? info.rejected.map((value: unknown) => String(value))
              : [],
          };
        } catch (error: any) {
          sendTest = {
            attempted: true,
            ok: false,
            to: targetEmail,
            error: {
              code: String(error?.code || ""),
              responseCode: Number(error?.responseCode || 0) || undefined,
              message: String(error?.message || "SMTP send test failed"),
            },
          };
        }
      }
    }

    const statusCode =
      health.ok && (!sendTest.attempted || sendTest.ok) ? 200 : 503;

    return res.status(statusCode).json({
      checkedAt: new Date().toISOString(),
      endpointEnabled: true,
      health,
      sendTest,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to run SMTP health check",
      error: String(error?.message || error),
    });
  }
};

import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../../models/Users";
import Child from "../../models/Child";
import ChildEnrollmentRequest from "../../models/ChildEnrollmentRequest";
import ChildDevelopmentCenter from "../../models/ChildDevelopmentCenter";
import {
  isValidEmailAddress,
  mapCredentialDeliveryError,
  sendTeacherCredentialsEmail,
} from "../../services/notifications/teacher-credentials.service";

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
    if (
      daycareCenterId !== undefined &&
      daycareCenterId !== null &&
      String(daycareCenterId).trim()
    ) {
      if (!mongoose.Types.ObjectId.isValid(String(daycareCenterId))) {
        return res.status(400).json({ message: "Invalid center selected." });
      }

      const daycareCenter = await ChildDevelopmentCenter.findById(
        daycareCenterId,
      )
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
        ...(nextDaycareCenterId !== undefined
          ? { daycareCenter: nextDaycareCenterId }
          : {}),
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

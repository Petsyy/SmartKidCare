import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  adminUserRepository,
  adminChildRepository,
  adminEnrollmentRepository,
  adminCenterRepository,
} from "./admin.repository";
import {
  isValidEmailAddress,
  mapCredentialDeliveryError,
  sendTeacherCredentialsEmail,
} from "../notifications/teacher-credentials.service";
import { generateTempPassword } from "../../shared/utils/generate-temp-password";
import mongoose from "mongoose";

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

    const existing = await adminUserRepository.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const daycareCenter = await adminCenterRepository.findActiveById(daycareCenterId);
    if (!daycareCenter || daycareCenter.isActive === false) {
      return res.status(404).json({ message: "Selected center not found." });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const teacher = await adminUserRepository.create({
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

    const existing = await adminUserRepository.findByEmailExcluding(
      normalizedEmail,
      userId,
    );

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

      const daycareCenter = await adminCenterRepository.findById(daycareCenterId);
      if (!daycareCenter) {
        return res.status(404).json({ message: "Selected center not found." });
      }
      nextDaycareCenterId = daycareCenter._id as mongoose.Types.ObjectId;
    }

    const user = await adminUserRepository.updateUserWithPopulate(String(userId), {
      firstName,
      middleName,
      lastName,
      email: normalizedEmail,
      phone,
      ...(nextDaycareCenterId !== undefined
        ? { daycareCenter: nextDaycareCenterId }
        : {}),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (nextDaycareCenterId !== undefined && (user as any).role === "teacher") {
      await adminChildRepository.updateByTeacher(String(user._id), {
        daycareCenter: nextDaycareCenterId,
      });
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
    const user = await adminUserRepository.findById(String(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found." });

    const tempPassword = generateTempPassword();
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

    const user = await adminUserRepository.findById(String(req.params.id));
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

    const user = await adminUserRepository.findByIdSelect(
      String(req.params.id),
      "role email",
    );
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.role === "parent") {
      await Promise.all([
        adminChildRepository.unlinkParent(String(user._id)),
        adminEnrollmentRepository.deleteByParentEmail(user.email),
      ]);
    }

    if (user.role === "teacher") {
      const [linkedChildrenCount, linkedRequestsCount] = await Promise.all([
        adminChildRepository.countByTeacher(String(user._id)),
        adminEnrollmentRepository.countByTeacher(String(user._id)),
      ]);

      if (linkedChildrenCount > 0 || linkedRequestsCount > 0) {
        return res.status(409).json({
          message:
            "Cannot delete this teacher account because it has linked child records or enrollment requests. Deactivate the account instead.",
        });
      }
    }

    await adminUserRepository.deleteById(String(req.params.id));

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

    const parent = await adminUserRepository.findByIdSelect(
      String(req.params.parentId),
      "email",
    );

    if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    }

    const [children, requests] = await Promise.all([
      adminChildRepository.findByParent(String(req.params.parentId)),
      adminEnrollmentRepository.findByParentEmail(parent.email),
    ]);

    res.json({ children, requests });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

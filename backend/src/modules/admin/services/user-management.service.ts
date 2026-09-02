import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { 
  adminUserRepository, 
  adminChildRepository, 
  adminEnrollmentRepository, 
  adminCenterRepository, 
} from "../repositories/admin.repository";
import {
  isValidEmailAddress,
  mapCredentialDeliveryError,
  sendTeacherCredentialsEmail,
} from "../../notifications/services/teacher-credentials.service";
import { generateTempPassword } from "../../../shared/utils/generate-temp-password";
import { ConflictError } from "../../../shared/errors/app-error";

export class AdminUserManagementService {
  async createTeacher(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
    daycareCenterId: string;
  }) {
    const { firstName, middleName, lastName, email, phone, daycareCenterId } = data;

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await adminUserRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("Email already in use");
    }

    const daycareCenter = await adminCenterRepository.findActiveById(daycareCenterId);
    if (!daycareCenter || daycareCenter.isActive === false) {
      throw new Error("Selected center not found.");
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
    delete teacherResponse.password;
    teacherResponse.daycareCenterId = String(daycareCenter._id);
    teacherResponse.daycareCenter = daycareCenter;

    return {
      teacher: teacherResponse,
      credentials: {
        email: normalizedEmail,
        tempPassword,
      },
      emailDelivery,
    };
  }

  async updateUserProfile(userId: string, data: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    daycareCenterId?: string;
  }) {
    const { firstName, middleName, lastName, email, phone, daycareCenterId } = data;

    const existingUser = await adminUserRepository.findByIdSelect(
      userId,
      "role daycareCenter",
    );
    if (!existingUser) {
      throw new Error("User not found.");
    }
    
    let normalizedEmail: string | undefined;
    if (email) {
      normalizedEmail = String(email).toLowerCase().trim();
      const existing = await adminUserRepository.findByEmailExcluding(normalizedEmail, userId);
      if (existing) {
        throw new Error("Email already in use.");
      }
    }

    let nextDaycareCenterId: mongoose.Types.ObjectId | undefined;
    if (daycareCenterId !== undefined && daycareCenterId !== null && String(daycareCenterId).trim()) {
      const daycareCenter = await adminCenterRepository.findById(daycareCenterId);
      if (!daycareCenter) {
        throw new Error("Selected center not found.");
      }
      nextDaycareCenterId = daycareCenter._id as mongoose.Types.ObjectId;
    }

    const isTeacherCenterTransfer =
      nextDaycareCenterId !== undefined &&
      existingUser.role === "teacher" &&
      String(existingUser.daycareCenter || "") !== String(nextDaycareCenterId);

    if (isTeacherCenterTransfer) {
      const activeChildren = await adminChildRepository.countActiveByTeacher(userId);
      if (activeChildren > 0) {
        throw new ConflictError(
          `Reassign ${activeChildren} active child${activeChildren === 1 ? "" : "ren"} before transferring this teacher to another center.`,
        );
      }
    }

    const user = await adminUserRepository.updateUserWithPopulate(userId, {
      firstName,
      middleName,
      lastName,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      phone,
      ...(nextDaycareCenterId !== undefined ? { daycareCenter: nextDaycareCenterId } : {}),
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  }

  async resetPassword(userId: string) {
    const user = await adminUserRepository.findById(userId);
    if (!user) throw new Error("User not found.");

    const tempPassword = generateTempPassword();
    user.password = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpPurpose = undefined;
    user.latestTempPassword = tempPassword;
    user.latestTempPasswordIssuedAt = new Date();

    await user.save();

    return {
      credentials: {
        email: user.email,
        tempPassword,
      },
    };
  }

  async toggleUserStatus(userId: string) {
    const user = await adminUserRepository.findById(userId);
    if (!user) throw new Error("User not found.");

    user.isActive = !user.isActive;
    await user.save();

    return { isActive: user.isActive };
  }

  async deleteUser(userId: string) {
    const user = await adminUserRepository.findByIdSelect(userId, "role email");
    if (!user) throw new Error("User not found.");

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
        throw new Error("Cannot delete this teacher account because it has linked child records or enrollment requests. Deactivate the account instead.");
      }
    }

    await adminUserRepository.deleteById(userId);
  }

  async getParentChildren(parentId: string) {
    const parent = await adminUserRepository.findByIdSelect(parentId, "email");
    if (!parent) {
      throw new Error("Parent not found.");
    }

    const [children, requests] = await Promise.all([
      adminChildRepository.findByParent(parentId),
      adminEnrollmentRepository.findByParentEmail(parent.email),
    ]);

    return { children, requests };
  }
}

export const adminUserManagementService = new AdminUserManagementService();

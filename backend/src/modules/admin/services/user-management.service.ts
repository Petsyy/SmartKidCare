import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import mongoose from "mongoose";
import { 
  adminUserRepository, 
  adminChildRepository, 
 
  adminCenterRepository, 
} from "../repositories/admin.repository";
import {
  isValidEmailAddress,
  mapCredentialDeliveryError,
  sendTeacherCredentialsEmail,
} from "../../notifications/services/teacher-credentials.service";
import { generateTempPassword } from "../../../shared/utils/generate-temp-password";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { SINGLE_CENTER } from "../../../shared/config/single-center";
import {
  getCaptainActivationUrl,
  sendCaptainInvitationEmail,
} from "../../notifications/services/captain-invitation.service";

const CAPTAIN_INVITATION_TTL_MS = 24 * 60 * 60 * 1000;
const CAPTAIN_RESEND_COOLDOWN_MS = 60 * 1000;
const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const sanitizeCaptain = (captain: any) => {
  const result = captain.toObject?.() ?? { ...captain };
  delete result.password;
  delete result.captainInvitationTokenHash;
  delete result.latestTempPassword;
  return result;
};

export class AdminUserManagementService {
  async createCaptain(data: {
    username: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    replaceCaptainId?: string;
  }, invitedBy: string) {
    const normalizedEmail = String(data.email).toLowerCase().trim();
    const normalizedUsername = String(data.username).trim().toLowerCase();
    const normalizedPhone = String(data.phone).replace(/[\s-]/g, "");
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      throw new ValidationError("Phone number must use the format 09XXXXXXXXX.");
    }
    const existing = await adminUserRepository.findByEmail(normalizedEmail);
    if (existing) throw new ConflictError("Email already in use.");

    const existingUsername = await adminUserRepository.findByUsername(normalizedUsername);
    if (existingUsername) throw new ConflictError("Username already in use.");

    const daycareCenter = await adminCenterRepository.findActiveByCode(SINGLE_CENTER.code);
    if (!daycareCenter) throw new NotFoundError("Active daycare center");

    const centerId = String(daycareCenter._id);
    const activeCaptain = await adminUserRepository.findActiveCaptainByCenter(centerId);
    if (activeCaptain && !data.replaceCaptainId) {
      throw new ConflictError("This center already has an active Barangay Captain.");
    }
    if (data.replaceCaptainId) {
      if (!activeCaptain || String(activeCaptain._id) !== data.replaceCaptainId) {
        throw new ConflictError("The selected replacement account is not the active captain for this center.");
      }
    }
    const pendingCaptain = await adminUserRepository.findPendingCaptainByCenter(centerId);
    if (pendingCaptain) {
      throw new ConflictError("This center already has a pending captain invitation.");
    }

    const invitationToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + CAPTAIN_INVITATION_TTL_MS);
    const captain = await adminUserRepository.create({
      firstName: data.firstName.trim(),
      middleName: data.middleName?.trim() || undefined,
      lastName: data.lastName.trim(),
      phone: normalizedPhone,
      username: normalizedUsername,
      email: normalizedEmail,
      daycareCenter: daycareCenter._id,
      password: await bcrypt.hash(randomBytes(48).toString("hex"), 12),
      role: "barangay_captain",
      isActive: false,
      mustChangePassword: true,
      adminMfaEnabled: true,
      captainOnboardingStatus: "invitation_pending",
      captainInvitationTokenHash: hashInvitationToken(invitationToken),
      captainInvitationExpiresAt: expiresAt,
      captainInvitationSentAt: new Date(),
      captainInvitedBy: new mongoose.Types.ObjectId(invitedBy),
      captainReplaces: activeCaptain?._id,
    });

    await adminUserRepository.createAuditEvent({
      action: "CAPTAIN_INVITATION_CREATED",
      actor: invitedBy,
      targetUser: String(captain._id),
      daycareCenter: centerId,
      metadata: { replacesCaptainId: activeCaptain ? String(activeCaptain._id) : null },
    });

    let delivery = { sent: true, message: undefined as string | undefined };
    try {
      await sendCaptainInvitationEmail({
        to: normalizedEmail,
        firstName: captain.firstName,
        centerName: daycareCenter.name,
        activationUrl: getCaptainActivationUrl(invitationToken),
        expiresAt,
      });
    } catch (error) {
      delivery = { sent: false, message: mapCredentialDeliveryError(error) };
      await adminUserRepository.createAuditEvent({
        action: "CAPTAIN_INVITATION_DELIVERY_FAILED",
        actor: invitedBy,
        targetUser: String(captain._id),
        daycareCenter: centerId,
      });
    }

    return {
      captain: sanitizeCaptain(captain),
      assignedCenter: daycareCenter,
      invitation: { status: "invitation_pending", expiresAt, delivery },
    };
  }

  async resendCaptainInvitation(captainId: string, actorId: string) {
    const captain = await adminUserRepository.findCaptainById(captainId);
    if (!captain) throw new NotFoundError("Captain account");
    if (captain.captainOnboardingStatus !== "invitation_pending") {
      throw new ConflictError("Only pending captain invitations can be resent.");
    }
    if (
      captain.captainInvitationSentAt &&
      Date.now() - captain.captainInvitationSentAt.getTime() < CAPTAIN_RESEND_COOLDOWN_MS
    ) {
      throw new ConflictError("Please wait one minute before resending the invitation.");
    }
    const center = await adminCenterRepository.findActiveByCode(SINGLE_CENTER.code);
    if (!center) throw new NotFoundError("Active daycare center");
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + CAPTAIN_INVITATION_TTL_MS);
    captain.captainInvitationTokenHash = hashInvitationToken(token);
    captain.captainInvitationExpiresAt = expiresAt;
    captain.captainInvitationSentAt = new Date();
    await captain.save();
    let delivery = { sent: true, message: undefined as string | undefined };
    try {
      await sendCaptainInvitationEmail({
        to: captain.email,
        firstName: captain.firstName,
        centerName: center.name,
        activationUrl: getCaptainActivationUrl(token),
        expiresAt,
      });
    } catch (error) {
      delivery = { sent: false, message: mapCredentialDeliveryError(error) };
      await adminUserRepository.createAuditEvent({
        action: "CAPTAIN_INVITATION_DELIVERY_FAILED",
        actor: actorId,
        targetUser: String(captain._id),
        daycareCenter: String(center._id),
        metadata: { operation: "resend" },
      });
    }
    await adminUserRepository.createAuditEvent({
      action: "CAPTAIN_INVITATION_RESENT",
      actor: actorId,
      targetUser: String(captain._id),
      daycareCenter: String(center._id),
    });
    return { expiresAt, delivery };
  }

  async revokeCaptainInvitation(captainId: string, actorId: string) {
    const captain = await adminUserRepository.findCaptainById(captainId);
    if (!captain) throw new NotFoundError("Captain account");
    if (captain.captainOnboardingStatus !== "invitation_pending") {
      throw new ConflictError("Only pending captain invitations can be revoked.");
    }
    captain.captainOnboardingStatus = "inactive";
    captain.captainInvitationTokenHash = undefined;
    captain.captainInvitationExpiresAt = undefined;
    await captain.save();
    await adminUserRepository.createAuditEvent({
      action: "CAPTAIN_INVITATION_REVOKED",
      actor: actorId,
      targetUser: String(captain._id),
      daycareCenter: captain.daycareCenter ? String(captain.daycareCenter) : null,
    });
  }

  async createTeacher(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
    daycareCenterId?: string;
  }) {
    const { firstName, middleName, lastName, email, phone } = data;

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await adminUserRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("Email already in use");
    }

    const daycareCenter = await adminCenterRepository.findActiveByCode(
      SINGLE_CENTER.code,
    );
    if (!daycareCenter || daycareCenter.isActive === false) {
      throw new Error(`${SINGLE_CENTER.name} is not configured or active.`);
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
    const { firstName, middleName, lastName, email, phone } = data;

    const existingUser = await adminUserRepository.findByIdSelect(
      userId,
      "role daycareCenter",
    );
    if (!existingUser) {
      throw new Error("User not found.");
    }
    if (existingUser.role === "barangay_captain") throw new Error("Barangay Captain accounts cannot be managed here.");
    
    let normalizedEmail: string | undefined;
    if (email) {
      normalizedEmail = String(email).toLowerCase().trim();
      const existing = await adminUserRepository.findByEmailExcluding(normalizedEmail, userId);
      if (existing) {
        throw new Error("Email already in use.");
      }
    }

    const user = await adminUserRepository.updateUserWithPopulate(userId, {
      firstName,
      middleName,
      lastName,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      phone,
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  }

  async resetPassword(userId: string) {
    const user = await adminUserRepository.findById(userId);
    if (!user) throw new Error("User not found.");
    if (user.role === "barangay_captain") throw new Error("Barangay Captain accounts cannot be managed here.");

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
    if (user.role === "barangay_captain") throw new Error("Barangay Captain accounts cannot be managed here.");

    user.isActive = !user.isActive;
    await user.save();

    return { isActive: user.isActive };
  }

  async deleteUser(userId: string) {
    const user = await adminUserRepository.findByIdSelect(userId, "role email");
    if (!user) throw new Error("User not found.");
    if (user.role === "barangay_captain") throw new Error("Barangay Captain accounts cannot be managed here.");

    if (user.role === "parent") {
      await adminChildRepository.unlinkParent(String(user._id));
    }

    if (user.role === "teacher") {
      const linkedChildrenCount = await adminChildRepository.countByTeacher(String(user._id));

      if (linkedChildrenCount > 0) {
        throw new Error("Cannot delete this teacher account because it has linked child records. Deactivate the account instead.");
      }
    }

    await adminUserRepository.deleteById(userId);
  }

  async getParentChildren(parentId: string) {
    const parent = await adminUserRepository.findByIdSelect(parentId, "email");
    if (!parent) {
      throw new Error("Parent not found.");
    }

    const children = await adminChildRepository.findByParent(parentId);

    return { children, requests: [] };
  }
}

export const adminUserManagementService = new AdminUserManagementService();

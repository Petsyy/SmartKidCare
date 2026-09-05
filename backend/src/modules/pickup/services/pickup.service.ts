import bcrypt from "bcryptjs";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import {
  pickupRecordRepository,
  pickupCodeRepository,
} from "../repositories/pickup.repository";
import Child from "../../../models/Child";
import User from "../../../models/Users";
import Attendance from "../../../models/Attendance";
import {
  sendExpoPushNotifications,
  extractUserPushTokens,
} from "../../notifications/services/push-notification.service";
import { sendEmail } from "../../notifications/services/email.service";
import {
  parsePositiveInt,
  shouldPaginate,
} from "../../../shared/utils/records.utils";
import { recordServiceSupport } from "../../../shared/services/record-service-support";
import type {
  RequestPickupCodeInput,
  VerifyPickupCodeInput,
  ManualReleaseInput,
  PickupAuthUser,
  PickupPaginatedResult,
} from "../types/pickup.types";

const generatePickupCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

class PickupService {
  private getTeacherCenterId(user: PickupAuthUser) {
    if (!user.daycareCenterId) {
      throw new ForbiddenError("Teacher is not assigned to a daycare center.");
    }

    return String(user.daycareCenterId);
  }

  private assertTeacherCanAccessChild(user: PickupAuthUser, child: any) {
    const teacherCenterId = this.getTeacherCenterId(user);
    if (String(child.daycareCenter) !== teacherCenterId) {
      throw new ForbiddenError("You are not authorized for this child.");
    }
  }

  private assertParentCanAccessChild(user: PickupAuthUser, child: any) {
    const parentId = child.parent?._id ?? child.parent;
    if (String(parentId) !== String(user.id)) {
      throw new ForbiddenError("You are not authorized for this child.");
    }
  }

  private getTodayRange() {
    const range = recordServiceSupport.parseDayRange(new Date());
    if (!range) {
      throw new ValidationError("Unable to resolve today's pickup date.");
    }

    return range;
  }

  public async requestPickupCode(
    user: PickupAuthUser,
    input: RequestPickupCodeInput,
  ) {
    if (user.role !== "parent") {
      throw new ForbiddenError("Only parents can request pickup codes.");
    }

    const child = await Child.findById(input.childId);
    if (!child) throw new NotFoundError("Child");

    this.assertParentCanAccessChild(user, child);

    const dayRange = this.getTodayRange();
    const pickupStatus = await pickupRecordRepository.findPickupStatus(
      child.id,
      dayRange.start,
    );
    if (pickupStatus) {
      throw new ValidationError("Child has already been released today.");
    }

    const activeCodes = await pickupCodeRepository.findActiveCodes(child.id);
    if (activeCodes.length > 0) {
      const mostRecentCode = activeCodes.reduce((latest, current) =>
        new Date(latest.createdAt) > new Date(current.createdAt)
          ? latest
          : current,
      );
      const timeSinceLastCode =
        Date.now() - new Date(mostRecentCode.createdAt).getTime();
      if (timeSinceLastCode < 60000) {
        throw new ValidationError(
          "Please wait a minute before requesting a new code.",
        );
      }
    }

    let intendedGuardianName = `${user.firstName} ${user.lastName}`;
    if (
      input.intendedGuardianIndex !== null &&
      input.intendedGuardianIndex !== undefined
    ) {
      const guardian =
        child.authorizedPickupPersons?.[input.intendedGuardianIndex];
      if (!guardian || !guardian.isActive) {
        throw new ValidationError(
          "Selected guardian is not authorized or inactive.",
        );
      }
      intendedGuardianName = `${guardian.firstName} ${guardian.lastName}`;
    }

    const code = generatePickupCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    await pickupCodeRepository.invalidatePreviousCodes(child.id);

    await pickupCodeRepository.create({
      child: child.id,
      parent: user.id,
      intendedGuardianIndex: input.intendedGuardianIndex ?? null,
      codeHash,
      expiresAt,
    });

    // Notify parent
    const parentUser = await User.findById(user.id);
    if (parentUser) {
      const tokens = extractUserPushTokens(parentUser);
      if (tokens.length > 0) {
        await sendExpoPushNotifications({
          tokens,
          title: "Pickup Code Generated",
          body: `Your pickup code for ${child.firstName} is ${code}. Valid for 60 minutes.`,
          data: { type: "pickup_code_generated", childId: child.id },
        }).catch(console.error);
      }

      // Email fallback
      if (parentUser.email) {
        await sendEmail({
          to: parentUser.email,
          subject: `Pickup Code for ${child.firstName}`,
          text: `Your pickup code for ${child.firstName} is ${code}. It is valid for 60 minutes. Please share this code with ${intendedGuardianName}.`,
        }).catch(console.error);
      }
    }

    return { expiresAt, childId: child.id, code };
  }

  public async verifyPickupCode(
    user: PickupAuthUser,
    input: VerifyPickupCodeInput,
  ) {
    if (user.role !== "teacher") {
      throw new ForbiddenError("Only teachers can verify pickup codes.");
    }

    const child = await Child.findById(input.childId).populate("parent");
    if (!child) throw new NotFoundError("Child");

    this.assertTeacherCanAccessChild(user, child);

    const dayRange = this.getTodayRange();
    const pickupStatus = await pickupRecordRepository.findPickupStatus(
      child.id,
      dayRange.start,
    );
    if (pickupStatus) {
      throw new ValidationError("Child has already been released today.");
    }

    // We have to check all active codes for this child since we don't know the hash
    const activeCodes = await pickupCodeRepository.findActiveCodes(child.id);

    let matchedCode = null;
    for (const c of activeCodes) {
      if (await bcrypt.compare(input.code, c.codeHash)) {
        matchedCode = c;
        break;
      }
    }

    if (!matchedCode) {
      throw new ValidationError("Invalid or expired pickup code.");
    }

    // Determine picker info
    let pickedUpByType = "parent";
    let name = "";
    let phone = "";
    let relationship = "Parent";
    let userId = null;

    const parentUser: any = child.parent;

    if (matchedCode.intendedGuardianIndex !== null) {
      pickedUpByType = "guardian";
      const guardian =
        child.authorizedPickupPersons?.[matchedCode.intendedGuardianIndex];
      if (!guardian || !guardian.isActive) {
        throw new ValidationError(
          "Selected guardian is not authorized or inactive.",
        );
      }
      name = `${guardian.firstName} ${guardian.lastName}`;
      phone = guardian.phone;
      relationship = guardian.relationship;
    } else if (parentUser) {
      userId = parentUser._id;
      name = `${parentUser.firstName} ${parentUser.lastName}`;
      phone = parentUser.phone || "";
    }

    matchedCode.used = true;
    await matchedCode.save();

    const pickupRecord = await pickupRecordRepository.create({
      child: child.id,
      daycareCenter: child.daycareCenter,
      pickedUpBy: {
        type: pickedUpByType,
        userId,
        guardianIndex: matchedCode.intendedGuardianIndex,
        name,
        phone,
        relationship,
      },
      verificationMethod: "pickup_code",
      verifiedByTeacher: user.id,
      pickedUpAt: new Date(),
      notes: input.notes || "",
    });

    // Notify parent
    if (parentUser) {
      const tokens = extractUserPushTokens(parentUser);
      if (tokens.length > 0) {
        await sendExpoPushNotifications({
          tokens,
          title: "Child Released",
          body: `${child.firstName} has been released to ${name}.`,
          data: { type: "child_released", childId: child.id },
        }).catch(console.error);
      }
    }

    return pickupRecord;
  }

  public async manualRelease(user: PickupAuthUser, input: ManualReleaseInput) {
    if (user.role !== "teacher") {
      throw new ForbiddenError("Only teachers can perform manual release.");
    }

    const child = await Child.findById(input.childId).populate("parent");
    if (!child) throw new NotFoundError("Child");

    this.assertTeacherCanAccessChild(user, child);

    const dayRange = this.getTodayRange();
    const pickupStatus = await pickupRecordRepository.findPickupStatus(
      child.id,
      dayRange.start,
    );
    if (pickupStatus) {
      throw new ValidationError("Child has already been released today.");
    }

    let name = "";
    let phone = "";
    let relationship = "";
    let userId = null;
    const parentUser: any = child.parent;

    if (input.pickedUpByType === "guardian") {
      if (input.guardianIndex === null || input.guardianIndex === undefined) {
        throw new ValidationError(
          "Guardian index is required for guardian release",
        );
      }
      const guardian = child.authorizedPickupPersons?.[input.guardianIndex];
      if (!guardian || !guardian.isActive) {
        throw new ValidationError("Guardian not found or inactive");
      }
      name = `${guardian.firstName} ${guardian.lastName}`;
      phone = guardian.phone;
      relationship = guardian.relationship;
    } else {
      if (parentUser) {
        userId = parentUser._id;
        name = `${parentUser.firstName} ${parentUser.lastName}`;
        phone = parentUser.phone || "";
        relationship = "Parent";
      }
    }

    const pickupRecord = await pickupRecordRepository.create({
      child: child.id,
      daycareCenter: child.daycareCenter,
      pickedUpBy: {
        type: input.pickedUpByType,
        userId,
        guardianIndex: input.guardianIndex,
        name,
        phone,
        relationship,
      },
      verificationMethod: "manual_override",
      verifiedByTeacher: user.id,
      pickedUpAt: new Date(),
      notes: input.notes,
    });

    // Notify parent
    if (parentUser) {
      const tokens = extractUserPushTokens(parentUser);
      if (tokens.length > 0) {
        await sendExpoPushNotifications({
          tokens,
          title: "Child Released",
          body: `${child.firstName} has been manually released to ${name}.`,
          data: { type: "child_released", childId: child.id },
        }).catch(console.error);
      }
    }

    return pickupRecord;
  }

  public async getPickupEligibleChildren(user: PickupAuthUser) {
    if (user.role !== "teacher") throw new ForbiddenError("Access denied.");

    const dayRange = this.getTodayRange();

    // 1. Get today's attendance for the teacher's center
    const attendance = await Attendance.findOne({
      teacher: user.id,
      daycareCenter: this.getTeacherCenterId(user),
      date: { $gte: dayRange.start, $lte: dayRange.end },
    }).lean();

    if (!attendance) return [];

    const presentChildIds = attendance.records
      .filter((r: any) => r.status === "present")
      .map((r: any) => String(r.child));

    if (presentChildIds.length === 0) return [];

    // 2. Filter out already picked up children today
    const pickupsToday = await pickupRecordRepository.findPickupsToday(
      this.getTeacherCenterId(user),
      dayRange.start,
    );

    const pickedUpIds = new Set(pickupsToday.map((p: any) => String(p.child)));
    const eligibleIds = presentChildIds.filter(
      (id: string) => !pickedUpIds.has(id),
    );

    // 3. Fetch children details
    const children = await Child.find({
      _id: { $in: eligibleIds },
      teacher: user.id,
      daycareCenter: this.getTeacherCenterId(user),
    })
      .select("firstName lastName studentId authorizedPickupPersons parent")
      .populate("parent", "firstName lastName phone email")
      .lean();

    return children;
  }

  public async getPickupStatus(user: PickupAuthUser, childId: string) {
    const child = await Child.findById(childId)
      .select("parent daycareCenter")
      .lean();
    if (!child) throw new NotFoundError("Child");

    if (user.role === "teacher") {
      this.assertTeacherCanAccessChild(user, child);
    } else if (user.role === "parent") {
      this.assertParentCanAccessChild(user, child);
    }

    const dayRange = this.getTodayRange();

    const pickup = await pickupRecordRepository.findPickupStatus(
      childId,
      dayRange.start,
    );

    if (pickup) {
      return { status: "released", pickup };
    }
    return { status: "pending" };
  }

  public async getPickupHistory(
    user: PickupAuthUser,
    query: any,
  ): Promise<PickupPaginatedResult<any> | any[]> {
    const filter: any = {};

    if (user.role === "teacher") {
      filter.daycareCenter = this.getTeacherCenterId(user);
    } else if (user.role === "parent") {
      const children = await Child.find({ parent: user.id })
        .select("_id")
        .lean();
      filter.child = { $in: children.map((c) => c._id) };
    } else if (user.role === "admin" && query.centerId) {
      filter.daycareCenter = query.centerId;
    }

    if (query.childId) {
      const child = await Child.findById(query.childId)
        .select("parent daycareCenter")
        .lean();
      if (!child) throw new NotFoundError("Child");

      if (user.role === "teacher") {
        this.assertTeacherCanAccessChild(user, child);
      } else if (user.role === "parent") {
        this.assertParentCanAccessChild(user, child);
      }

      filter.child = query.childId;
    }

    if (query.startDate && query.endDate) {
      filter.pickedUpAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    const result = await pickupRecordRepository.findHistory(filter);

    if (shouldPaginate(query)) {
      const page = parsePositiveInt(query.page, 1);
      const limit = parsePositiveInt(query.limit, 25);
      const total = result.length;
      const start = (page - 1) * limit;

      return {
        data: result.slice(start, start + limit),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: start + limit < total,
          hasPrevPage: page > 1,
        },
      };
    }

    return result;
  }
}

export const pickupService = new PickupService();





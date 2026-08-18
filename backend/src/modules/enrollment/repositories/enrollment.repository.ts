import mongoose from "mongoose";
import Child from "../../../models/Child";
import User, { IUser } from "../../../models/Users";
import ChildEnrollmentRequest from "../../../models/ChildEnrollmentRequest";
import ChildDevelopmentCenter from "../../../models/ChildDevelopmentCenter";
import { BaseRepository } from "../../../shared/repositories/base.repository";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── Child ────────────────────────────────────────────────────────────────────

export class EnrollmentChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  async findDuplicate(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
  ): Promise<any | null> {
    return this.model
      .findOne({
        firstName: { $regex: `^${escapeRegex(firstName)}$`, $options: "i" },
        lastName: { $regex: `^${escapeRegex(lastName)}$`, $options: "i" },
        dateOfBirth,
      })
      .select("_id")
      .lean();
  }
}

// ─── ChildEnrollmentRequest ───────────────────────────────────────────────────

export class EnrollmentRequestRepository extends BaseRepository<any> {
  constructor() {
    super(ChildEnrollmentRequest);
  }

  async findPendingDuplicate(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
  ): Promise<any | null> {
    return this.model
      .findOne({
        status: "pending",
        "child.firstName": {
          $regex: `^${escapeRegex(firstName)}$`,
          $options: "i",
        },
        "child.lastName": {
          $regex: `^${escapeRegex(lastName)}$`,
          $options: "i",
        },
        "child.dateOfBirth": dateOfBirth,
      })
      .select("_id")
      .lean();
  }

  async findByIdFull(requestId: string): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) return null;
    return this.model.findById(requestId);
  }

  async findByIdLean(requestId: string): Promise<any | null> {
    return this.model
      .findById(requestId)
      .select("status createdChild")
      .lean();
  }

  async findAllWithPopulate(filter: Record<string, unknown>): Promise<any[]> {
    return this.model
      .find(filter)
      .populate("requestedBy", "firstName middleName lastName email")
      .populate("daycareCenter", "name barangay code isActive")
      .populate("review.reviewedBy", "firstName middleName lastName email")
      .populate(
        "createdChild",
        "firstName middleName lastName studentId documentIntegrity",
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByTeacher(teacherId: string): Promise<any[]> {
    return this.model
      .find({ requestedBy: teacherId })
      .populate("daycareCenter", "name barangay code isActive")
      .populate("review.reviewedBy", "firstName middleName lastName email")
      .populate(
        "createdChild",
        "firstName middleName lastName studentId documentIntegrity",
      )
      .sort({ createdAt: -1 })
      .lean();
  }
}

// ─── ChildDevelopmentCenter ───────────────────────────────────────────────────

export class EnrollmentCenterRepository extends BaseRepository<any> {
  constructor() {
    super(ChildDevelopmentCenter);
  }

  async findActiveById(id: string): Promise<any | null> {
    return this.model.findById(id).select("_id isActive").lean();
  }

  async findByTeacherCenter(centerId: string): Promise<any[]> {
    return this.model
      .find({ _id: centerId, isActive: true })
      .select("_id name barangay code isActive")
      .sort({ barangay: 1, name: 1 })
      .lean();
  }
}

// ─── User ─────────────────────────────────────────────────────────────────────

export class EnrollmentUserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findTeacherById(id: string): Promise<any | null> {
    return this.model.findById(id).select("daycareCenter").lean();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({
      email: {
        $regex: `^${escapeRegex(String(email).trim())}$`,
        $options: "i",
      },
    });
  }

}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const enrollmentChildRepository = new EnrollmentChildRepository();
export const enrollmentRequestRepository = new EnrollmentRequestRepository();
export const enrollmentCenterRepository = new EnrollmentCenterRepository();
export const enrollmentUserRepository = new EnrollmentUserRepository();

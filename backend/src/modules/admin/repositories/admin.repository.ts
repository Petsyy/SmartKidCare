import mongoose from "mongoose";
import User, { IUser } from "../../../models/Users";
import Child from "../../../models/Child";

import ChildDevelopmentCenter from "../../../models/ChildDevelopmentCenter";
import SecurityAuditLog, {
  type SecurityAuditAction,
} from "../../../models/SecurityAuditLog";
import { BaseRepository } from "../../../shared/repositories/base.repository";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── User 

export class AdminUserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({
      email: {
        $regex: `^${escapeRegex(String(email).trim())}$`,
        $options: "i",
      },
    });
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return this.model.findOne({ username: String(username).trim() });
  }

  async findActiveCaptainByCenter(centerId: string): Promise<IUser | null> {
    return this.model.findOne({
      role: "barangay_captain",
      daycareCenter: centerId,
      isActive: true,
    });
  }

  async findPendingCaptainByCenter(centerId: string): Promise<IUser | null> {
    return this.model.findOne({
      role: "barangay_captain",
      daycareCenter: centerId,
      captainOnboardingStatus: "invitation_pending",
    });
  }

  async findCaptainById(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return this.model.findOne({ _id: id, role: "barangay_captain" });
  }

  async findCaptainInvitationByHash(hash: string): Promise<IUser | null> {
    return this.model
      .findOne({
        role: "barangay_captain",
        captainInvitationTokenHash: hash,
      })
      .select("+captainInvitationTokenHash");
  }

  async createAuditEvent(input: {
    action: SecurityAuditAction;
    actor?: string | null;
    targetUser: string;
    daycareCenter?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await SecurityAuditLog.create(input);
  }

  async getSystemOverview(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const role of ["teacher", "parent"] as const) {
      counts[`${role}Active`] = await this.model.countDocuments({ role, isActive: { $ne: false } });
      counts[`${role}Inactive`] = await this.model.countDocuments({ role, isActive: false });
    }
    return counts;
  }

  async findByEmailExcluding(
    email: string,
    excludeId: string,
  ): Promise<IUser | null> {
    return this.model.findOne({
      email: {
        $regex: `^${escapeRegex(String(email).trim())}$`,
        $options: "i",
      },
      _id: { $ne: new mongoose.Types.ObjectId(excludeId) },
    });
  }

  async findByIdSelect(id: string, select: string): Promise<IUser | null> {
    return this.model.findById(id).select(select).lean();
  }

  async findByIdWithPopulate(id: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(id, {}, { new: true })
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive")
      .exec();
  }

  async updateUserWithPopulate(
    id: string,
    data: Record<string, unknown>,
  ): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true })
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive")
      .exec();
  }
}

// ─── Child

export class AdminChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  async countByTeacher(teacherId: string): Promise<number> {
    return this.model.countDocuments({ teacher: teacherId });
  }

  async countActiveByTeacher(teacherId: string): Promise<number> {
    return this.model.countDocuments({ teacher: teacherId, status: "Active" });
  }

  async countByParent(parentId: string): Promise<number> {
    return this.model.countDocuments({ parent: parentId });
  }

  async findByParent(parentId: string): Promise<any[]> {
    return this.model
      .find({ parent: parentId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async unlinkParent(parentId: string): Promise<void> {
    await this.model.updateMany(
      { parent: parentId },
      { $set: { parent: null } },
    );
  }
}


// ─── ChildDevelopmentCenter

export class AdminCenterRepository extends BaseRepository<any> {
  constructor() {
    super(ChildDevelopmentCenter);
  }

  async findActiveById(id: string): Promise<any | null> {
    return this.model
      .findById(id)
      .select("_id name barangay isActive")
      .lean();
  }

  async findById(id: string): Promise<any | null> {
    return this.model.findById(id).select("_id").lean();
  }

  async findActiveByCode(code: string): Promise<any | null> {
    return this.model
      .findOne({ code, isActive: { $ne: false } })
      .select("_id name barangay code isActive")
      .lean();
  }
}

// ─── Singletons 

export const adminUserRepository = new AdminUserRepository();
export const adminChildRepository = new AdminChildRepository();

export const adminCenterRepository = new AdminCenterRepository();

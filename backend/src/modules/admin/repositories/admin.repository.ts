import mongoose from "mongoose";
import User, { IUser } from "../../../models/Users";
import Child from "../../../models/Child";
import ChildEnrollmentRequest from "../../../models/ChildEnrollmentRequest";
import ChildDevelopmentCenter from "../../../models/ChildDevelopmentCenter";
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

  async updateByTeacher(
    teacherId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.model.updateMany({ teacher: teacherId }, { $set: data });
  }

  async countByTeacher(teacherId: string): Promise<number> {
    return this.model.countDocuments({ teacher: teacherId });
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

// ─── ChildEnrollmentRequest

export class AdminEnrollmentRepository extends BaseRepository<any> {
  constructor() {
    super(ChildEnrollmentRequest);
  }

  async countByTeacher(teacherId: string): Promise<number> {
    return this.model.countDocuments({ requestedBy: teacherId });
  }

  async deleteByParentEmail(email: string): Promise<void> {
    await this.model.deleteMany({ "parent.email": email });
  }

  async findByParentEmail(email: string): Promise<any[]> {
    return this.model
      .find({ "parent.email": email, createdChild: null })
      .select("status child createdAt")
      .sort({ createdAt: -1 })
      .lean();
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
}

// ─── Singletons 

export const adminUserRepository = new AdminUserRepository();
export const adminChildRepository = new AdminChildRepository();
export const adminEnrollmentRepository = new AdminEnrollmentRepository();
export const adminCenterRepository = new AdminCenterRepository();

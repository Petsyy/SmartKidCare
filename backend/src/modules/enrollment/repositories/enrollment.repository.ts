import mongoose from "mongoose";
import Child from "../../../shared/models/child.model";
import ChildDevelopmentCenter from "../../../shared/models/child-development-center.model";
import User from "../../../shared/models/users.model";
import { BaseRepository } from "../../../shared/repositories/base.repository";

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
        firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
        lastName: { $regex: new RegExp(`^${lastName}$`, "i") },
        dateOfBirth: {
          $gte: new Date(new Date(dateOfBirth).setHours(0, 0, 0, 0)),
          $lt: new Date(new Date(dateOfBirth).setHours(23, 59, 59, 999)),
        },
      })
      .lean();
  }
}

export class EnrollmentCenterRepository extends BaseRepository<any> {
  constructor() {
    super(ChildDevelopmentCenter);
  }

  async findActiveById(id: string): Promise<any | null> {
    return this.model.findOne({ _id: id, isActive: true }).lean();
  }

  async findAllActive(): Promise<any[]> {
    return this.model
      .find({ isActive: true })
      .select("name barangay code")
      .sort({ name: 1 })
      .lean();
  }
}

export class EnrollmentUserRepository extends BaseRepository<any> {
  constructor() {
    super(User);
  }

  async findTeacherById(id: string): Promise<any | null> {
    return this.model
      .findOne({ _id: id, role: "teacher", isActive: true })
      .select("daycareCenter")
      .lean();
  }
}

export const enrollmentChildRepository = new EnrollmentChildRepository();
export const enrollmentCenterRepository = new EnrollmentCenterRepository();
export const enrollmentUserRepository = new EnrollmentUserRepository();

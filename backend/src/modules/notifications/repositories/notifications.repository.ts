import User from "../../../models/Users";
import Child from "../../../models/Child";
import Attendance from "../../../models/Attendance";
import Feeding from "../../../models/Feeding";
import { BaseRepository } from "../../../shared/repositories/base.repository";

// ─── User ─────────────────────────────────────────────────────────────────────

export class NotificationsUserRepository extends BaseRepository<any> {
  constructor() {
    super(User);
  }

  async findById(id: string): Promise<any | null> {
    return this.model.findById(id);
  }

  async findByIdLean(id: string): Promise<any | null> {
    return this.model.findById(id).lean();
  }

  async findTeachers(filter: Record<string, unknown> = {}): Promise<any[]> {
    return this.model
      .find({ role: "teacher", isActive: true, ...filter })
      .select("firstName middleName lastName pushToken pushTokens")
      .lean();
  }

  async findParentById(id: string): Promise<any | null> {
    return this.model
      .findOne({ _id: id, role: "parent", isActive: true })
      .select("firstName middleName lastName pushToken pushTokens")
      .lean();
  }

  async findTeacherById(id: string): Promise<any | null> {
    return this.model
      .findOne({ _id: id, role: "teacher", isActive: true })
      .select("firstName middleName lastName pushToken pushTokens")
      .lean();
  }

  async saveUser(user: any): Promise<any> {
    return user.save();
  }
}

// ─── Child ────────────────────────────────────────────────────────────────────

export class NotificationsChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  async findActiveByTeacherIds(teacherIds: string[]): Promise<any[]> {
    return this.model
      .find({ status: "Active", teacher: { $in: teacherIds } })
      .select("_id teacher")
      .lean();
  }

  async findActiveByTeacher(teacherId: string): Promise<any[]> {
    return this.model
      .find({ status: "Active", teacher: teacherId })
      .select("_id firstName middleName lastName")
      .lean();
  }

  async findActiveByParent(parentId: string): Promise<any[]> {
    return this.model
      .find({ parent: parentId, status: "Active" })
      .select("_id firstName middleName lastName")
      .lean();
  }
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export class NotificationsAttendanceRepository extends BaseRepository<any> {
  constructor() {
    super(Attendance);
  }

  async findByTeachersAndDate(
    teacherIds: string[],
    date: Date,
  ): Promise<any[]> {
    return this.model
      .find({ teacher: { $in: teacherIds }, date })
      .select("teacher records")
      .lean();
  }

  async findOneByTeacherAndDate(
    teacherId: string,
    date: Date,
  ): Promise<any | null> {
    return this.model
      .findOne({ teacher: teacherId, date })
      .select("records")
      .lean();
  }

  async findByChildIdsAndDate(
    childIds: string[],
    date: Date,
  ): Promise<any[]> {
    return this.model
      .find({
        date,
        "records.child": { $in: childIds },
      })
      .select("records createdAt")
      .lean();
  }
}

// ─── Feeding ──────────────────────────────────────────────────────────────────

export class NotificationsFeedingRepository extends BaseRepository<any> {
  constructor() {
    super(Feeding);
  }

  async findByTeachersAndDate(
    teacherIds: string[],
    date: Date,
  ): Promise<any[]> {
    return this.model
      .find({ teacher: { $in: teacherIds }, date })
      .select("teacher records")
      .lean();
  }

  async findOneByTeacherAndDate(
    teacherId: string,
    date: Date,
  ): Promise<any | null> {
    return this.model
      .findOne({ teacher: teacherId, date })
      .select("records")
      .lean();
  }

  async findByChildIdsAndDate(
    childIds: string[],
    date: Date,
  ): Promise<any[]> {
    return this.model
      .find({
        date,
        "records.child": { $in: childIds },
      })
      .select("records foodServed createdAt")
      .lean();
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const notificationsUserRepository = new NotificationsUserRepository();
export const notificationsChildRepository = new NotificationsChildRepository();
export const notificationsAttendanceRepository = new NotificationsAttendanceRepository();
export const notificationsFeedingRepository = new NotificationsFeedingRepository();

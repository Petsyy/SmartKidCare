import mongoose from "mongoose";
import User from "../../../models/Users";
import Child from "../../../models/Child";
import Attendance from "../../../models/Attendance";
import Feeding from "../../../models/Feeding";
import AdminNotification, {
  type IAdminNotification,
} from "../../../models/AdminNotification";
import ParentNotification from "../../../models/ParentNotification";
import { BaseRepository } from "../../../shared/repositories/base.repository";
import type {
  AdminNotificationRepositoryContract,
  AdminNotificationView,
  CreateAdminNotificationInput,
} from "../types/admin-notification.types";
import { toLocalDayUtcRange } from "../../../shared/utils/date.utils";

const MANILA_UTC_OFFSET_MINUTES = 8 * 60;

const getManilaDayRange = (date: Date) =>
  toLocalDayUtcRange(date, MANILA_UTC_OFFSET_MINUTES);

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

export class AdminNotificationRepository
  implements AdminNotificationRepositoryContract
{
  async createOnce(
    input: CreateAdminNotificationInput,
  ): Promise<IAdminNotification> {
    const filter = {
      recipientId: new mongoose.Types.ObjectId(input.recipientId),
      deduplicationKey: input.deduplicationKey,
    };

    try {
      const notification = await AdminNotification.findOneAndUpdate(
        filter,
        {
          $setOnInsert: {
            ...input,
            recipientId: filter.recipientId,
            daycareCenterId: input.daycareCenterId
              ? new mongoose.Types.ObjectId(input.daycareCenterId)
              : null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();

      if (!notification) {
        throw new Error("Admin notification could not be persisted.");
      }
      return notification;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const existing = await AdminNotification.findOne(filter).exec();
      if (!existing) throw error;
      return existing;
    }
  }

  async findFeed(input: {
    recipientId: string;
    view: AdminNotificationView;
    cursor?: { createdAt: Date; id: string };
    limit: number;
    now: Date;
  }): Promise<IAdminNotification[]> {
    const query: Record<string, unknown> = {
      recipientId: new mongoose.Types.ObjectId(input.recipientId),
      expiresAt: { $gt: input.now },
    };

    if (input.view === "archived") {
      query.archivedAt = { $ne: null };
    } else {
      query.archivedAt = null;
      if (input.view === "unread") query.readAt = null;
    }

    if (input.cursor) {
      query.$or = [
        { createdAt: { $lt: input.cursor.createdAt } },
        {
          createdAt: input.cursor.createdAt,
          _id: { $lt: new mongoose.Types.ObjectId(input.cursor.id) },
        },
      ];
    }

    return AdminNotification.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(input.limit)
      .exec();
  }

  async countUnread(recipientId: string, now: Date): Promise<number> {
    return AdminNotification.countDocuments({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      readAt: null,
      archivedAt: null,
      expiresAt: { $gt: now },
    }).exec();
  }

  async updateRead(input: {
    recipientId: string;
    notificationId: string;
    read: boolean;
    now: Date;
  }): Promise<IAdminNotification | null> {
    return AdminNotification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(input.notificationId),
        recipientId: new mongoose.Types.ObjectId(input.recipientId),
        archivedAt: null,
        expiresAt: { $gt: input.now },
      },
      { $set: { readAt: input.read ? input.now : null } },
      { new: true },
    ).exec();
  }

  async markAllRead(input: {
    recipientId: string;
    now: Date;
  }): Promise<number> {
    const result = await AdminNotification.updateMany(
      {
        recipientId: new mongoose.Types.ObjectId(input.recipientId),
        readAt: null,
        archivedAt: null,
        expiresAt: { $gt: input.now },
      },
      { $set: { readAt: input.now } },
    ).exec();
    return result.modifiedCount;
  }

  async updateArchive(input: {
    recipientId: string;
    notificationId: string;
    archived: boolean;
    now: Date;
  }): Promise<IAdminNotification | null> {
    const update = input.archived
      ? { archivedAt: input.now, readAt: input.now }
      : { archivedAt: null };

    return AdminNotification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(input.notificationId),
        recipientId: new mongoose.Types.ObjectId(input.recipientId),
        expiresAt: { $gt: input.now },
      },
      { $set: update },
      { new: true },
    ).exec();
  }
}

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

  async findCaptainById(id: string): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return this.model
      .findOne({ _id: id, role: "barangay_captain", isActive: true })
      .select("_id daycareCenter adminNotifyOperationalEvents")
      .lean();
  }

  async findActiveCaptainByCenter(daycareCenterId: string): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(daycareCenterId)) return null;
    return this.model
      .findOne({
        role: "barangay_captain",
        daycareCenter: daycareCenterId,
        isActive: true,
      })
      .select("_id daycareCenter adminNotifyOperationalEvents")
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

  async findByParent(parentId: string): Promise<any[]> {
    return this.model
      .find({ parent: parentId })
      .select("_id firstName middleName lastName")
      .lean();
  }

  async findNamesByIds(ids: string[]): Promise<any[]> {
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) return [];
    return this.model
      .find({ _id: { $in: validIds } })
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
    const range = getManilaDayRange(date);
    return this.model
      .find({ teacher: { $in: teacherIds }, date: { $gte: range.start, $lte: range.end } })
      .select("teacher records createdAt updatedAt")
      .lean();
  }

  async findOneByTeacherAndDate(
    teacherId: string,
    date: Date,
  ): Promise<any | null> {
    const range = getManilaDayRange(date);
    return this.model
      .findOne({ teacher: teacherId, date: { $gte: range.start, $lte: range.end } })
      .select("records createdAt updatedAt")
      .lean();
  }

  async findByChildIdsAndDate(
    childIds: string[],
    date: Date,
  ): Promise<any[]> {
    const range = getManilaDayRange(date);
    return this.model
      .find({
        date: { $gte: range.start, $lte: range.end },
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
    const range = getManilaDayRange(date);
    return this.model
      .find({ teacher: { $in: teacherIds }, date: { $gte: range.start, $lte: range.end } })
      .select("teacher records createdAt updatedAt")
      .lean();
  }

  async findOneByTeacherAndDate(
    teacherId: string,
    date: Date,
  ): Promise<any | null> {
    const range = getManilaDayRange(date);
    return this.model
      .findOne({ teacher: teacherId, date: { $gte: range.start, $lte: range.end } })
      .select("records createdAt updatedAt")
      .lean();
  }

  async findByChildIdsAndDate(
    childIds: string[],
    date: Date,
  ): Promise<any[]> {
    const range = getManilaDayRange(date);
    return this.model
      .find({
        date: { $gte: range.start, $lte: range.end },
        "records.child": { $in: childIds },
      })
      .select("records foodServed createdAt")
      .lean();
  }
}

export class NotificationsParentNotificationRepository extends BaseRepository<any> {
  constructor() {
    super(ParentNotification);
  }

  async findByParentAndDate(
    parentId: string,
    date: Date,
  ): Promise<any[]> {
    const range = getManilaDayRange(date);
    return this.model
      .find({
        recipient: parentId,
        createdAt: { $gte: range.start, $lte: range.end },
      })
      .select("child evaluation eventType title message createdAt")
      .sort({ createdAt: -1 })
      .lean();
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const notificationsUserRepository = new NotificationsUserRepository();
export const notificationsChildRepository = new NotificationsChildRepository();
export const notificationsAttendanceRepository = new NotificationsAttendanceRepository();
export const notificationsFeedingRepository = new NotificationsFeedingRepository();
export const notificationsParentNotificationRepository = new NotificationsParentNotificationRepository();
export const adminNotificationRepository = new AdminNotificationRepository();

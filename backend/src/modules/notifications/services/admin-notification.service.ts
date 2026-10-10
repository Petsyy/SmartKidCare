import mongoose from "mongoose";
import type { IAdminNotification } from "../../../models/AdminNotification";
import {
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { logger } from "../../../shared/lib/logger";
import {
  adminNotificationRepository,
  notificationsChildRepository,
  notificationsUserRepository,
} from "../repositories/notifications.repository";
import type {
  AdminNotificationCursor,
  AdminNotificationFeedInput,
  AdminNotificationFeedResult,
  AdminNotificationItem,
  AdminNotificationServiceDependencies,
  CreateAdminNotificationInput,
  PublishOperationalNotificationInput,
  PublishSecurityNotificationInput,
} from "../types/admin-notification.types";

const NOTIFICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const defaultDependencies: AdminNotificationServiceDependencies = {
  repository: adminNotificationRepository,
  findCaptainById: (id) => notificationsUserRepository.findCaptainById(id),
  findActiveCaptainByCenter: (daycareCenterId) =>
    notificationsUserRepository.findActiveCaptainByCenter(daycareCenterId),
  findChildNamesByIds: (ids) =>
    notificationsChildRepository.findNamesByIds(ids),
  now: () => new Date(),
};

const toId = (value: unknown): string => {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id ?? "");
  }
  return String(value ?? "");
};

const toName = (value: {
  firstName?: string;
  middleName?: string;
  lastName?: string;
}): string =>
  [value.firstName, value.middleName, value.lastName]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

const summarizeNames = (names: string[]): string => {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  const visibleNames = uniqueNames.slice(0, 3);
  const remaining = uniqueNames.length - visibleNames.length;
  if (!visibleNames.length) return "the affected children";
  return remaining > 0
    ? `${visibleNames.join(", ")} and ${remaining} ${remaining === 1 ? "other" : "others"}`
    : visibleNames.join(", ");
};

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);

const encodeCursor = (notification: IAdminNotification): string =>
  Buffer.from(
    JSON.stringify({
      createdAt: notification.createdAt.toISOString(),
      id: String(notification._id),
    } satisfies AdminNotificationCursor),
  ).toString("base64url");

const decodeCursor = (
  value: string | undefined,
): { createdAt: Date; id: string } | undefined => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<AdminNotificationCursor>;
    const createdAt = new Date(String(parsed.createdAt ?? ""));
    const id = String(parsed.id ?? "");
    if (
      Number.isNaN(createdAt.getTime()) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      throw new Error("Invalid cursor values.");
    }
    return { createdAt, id };
  } catch {
    throw new ValidationError("Invalid notification cursor.");
  }
};

const toItem = (notification: IAdminNotification): AdminNotificationItem => ({
  id: String(notification._id),
  category: notification.category,
  eventType: notification.eventType,
  title: notification.title,
  message: notification.message,
  actionPath: notification.actionPath,
  actionLabel: notification.actionLabel,
  readAt: notification.readAt?.toISOString() ?? null,
  archivedAt: notification.archivedAt?.toISOString() ?? null,
  createdAt: notification.createdAt.toISOString(),
  expiresAt: notification.expiresAt.toISOString(),
});

export class AdminNotificationService {
  constructor(
    private readonly dependencies: AdminNotificationServiceDependencies = defaultDependencies,
  ) {}

  async getFeed(
    input: AdminNotificationFeedInput,
  ): Promise<AdminNotificationFeedResult> {
    const now = this.dependencies.now();
    const notifications = await this.dependencies.repository.findFeed({
      recipientId: input.recipientId,
      view: input.view,
      cursor: decodeCursor(input.cursor),
      limit: input.limit + 1,
      now,
    });
    const hasMore = notifications.length > input.limit;
    const page = notifications.slice(0, input.limit);
    const unreadCount = await this.dependencies.repository.countUnread(
      input.recipientId,
      now,
    );

    return {
      items: page.map(toItem),
      unreadCount,
      nextCursor:
        hasMore && page.length ? encodeCursor(page[page.length - 1]) : null,
    };
  }

  async setRead(input: {
    recipientId: string;
    notificationId: string;
    read: boolean;
  }): Promise<AdminNotificationItem> {
    const updated = await this.dependencies.repository.updateRead({
      ...input,
      now: this.dependencies.now(),
    });
    if (!updated) throw new NotFoundError("Notification");
    return toItem(updated);
  }

  async markAllRead(recipientId: string): Promise<{
    updatedCount: number;
    unreadCount: 0;
  }> {
    const updatedCount = await this.dependencies.repository.markAllRead({
      recipientId,
      now: this.dependencies.now(),
    });
    return { updatedCount, unreadCount: 0 };
  }

  async setArchived(input: {
    recipientId: string;
    notificationId: string;
    archived: boolean;
  }): Promise<AdminNotificationItem> {
    const updated = await this.dependencies.repository.updateArchive({
      ...input,
      now: this.dependencies.now(),
    });
    if (!updated) throw new NotFoundError("Notification");
    return toItem(updated);
  }

  private async createNotification(
    input: Omit<CreateAdminNotificationInput, "expiresAt">,
  ): Promise<IAdminNotification> {
    const now = this.dependencies.now();
    return this.dependencies.repository.createOnce({
      ...input,
      expiresAt: new Date(now.getTime() + NOTIFICATION_RETENTION_MS),
    });
  }

  private async publishOperational(
    input: PublishOperationalNotificationInput,
  ): Promise<IAdminNotification | null> {
    const captain = input.recipientId
      ? await this.dependencies.findCaptainById(input.recipientId)
      : await this.dependencies.findActiveCaptainByCenter(
          input.daycareCenterId,
        );
    if (!captain || captain.adminNotifyOperationalEvents === false) return null;
    if (
      input.recipientId &&
      toId(captain.daycareCenter) !== input.daycareCenterId
    ) {
      return null;
    }

    return this.createNotification({
      ...input,
      recipientId: toId(captain._id),
      category: "operational",
    });
  }

  private async safelyPublish(
    eventType: string,
    sourceId: string,
    operation: () => Promise<IAdminNotification | null>,
  ): Promise<IAdminNotification | null> {
    try {
      return await operation();
    } catch (error) {
      logger.error("Admin notification publishing failed.", {
        eventType,
        sourceId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async publishChildEnrolled(input: {
    daycareCenterId: string;
    childId: string;
    studentId?: string;
    childName: string;
  }): Promise<IAdminNotification | null> {
    const sourceId = input.childId;
    return this.safelyPublish("child_enrolled", sourceId, () =>
      this.publishOperational({
        daycareCenterId: input.daycareCenterId,
        eventType: "child_enrolled",
        title: "Child Enrolled",
        message: `${input.childName || "A child"} was successfully enrolled.`,
        actionPath: `/monitoring/records?prefillSearch=${encodeURIComponent(
          input.studentId || input.childName,
        )}`,
        actionLabel: "View daycare record",
        sourceId,
        deduplicationKey: `child_enrolled:${sourceId}`,
      }),
    );
  }

  async publishAttendanceAbsence(input: {
    daycareCenterId: string;
    batchId: string;
    date: Date;
    records: Array<{ child: unknown; status: string }>;
  }): Promise<IAdminNotification | null> {
    const absentRecords = input.records.filter(
      (record) => String(record.status).toLowerCase() === "absent",
    );
    if (!absentRecords.length) return null;

    return this.safelyPublish("attendance_absence", input.batchId, async () => {
      const childIds = absentRecords.map((record) => toId(record.child));
      const children = await this.dependencies.findChildNamesByIds(childIds);
      const namesById = new Map(
        children.map((child) => [toId(child._id), toName(child)]),
      );
      const names = childIds.map((id) => namesById.get(id) || "Child");
      const count = absentRecords.length;
      return this.publishOperational({
        daycareCenterId: input.daycareCenterId,
        eventType: "attendance_absence",
        title: `${count} ${count === 1 ? "Child" : "Children"} Marked Absent`,
        message: `${count === 1 ? "One child was" : `${count} children were`} marked absent on ${formatDate(input.date)}: ${summarizeNames(names)}.`,
        actionPath: "/monitoring/reports/overview",
        actionLabel: "View attendance report",
        sourceId: input.batchId,
        deduplicationKey: `attendance_absence:${input.batchId}`,
      });
    });
  }

  async publishFeedingMissed(input: {
    daycareCenterId: string;
    batchId: string;
    date: Date;
    foodServed: string;
    records: Array<{ child: unknown; status: string }>;
  }): Promise<IAdminNotification | null> {
    const missedRecords = input.records.filter(
      (record) => String(record.status).toLowerCase() === "missed",
    );
    if (!missedRecords.length) return null;

    return this.safelyPublish("feeding_missed", input.batchId, async () => {
      const childIds = missedRecords.map((record) => toId(record.child));
      const children = await this.dependencies.findChildNamesByIds(childIds);
      const namesById = new Map(
        children.map((child) => [toId(child._id), toName(child)]),
      );
      const names = childIds.map((id) => namesById.get(id) || "Child");
      const count = missedRecords.length;
      const meal = String(input.foodServed || "the scheduled meal").trim();
      return this.publishOperational({
        daycareCenterId: input.daycareCenterId,
        eventType: "feeding_missed",
        title: `${count} ${count === 1 ? "Child" : "Children"} Missed Feeding`,
        message: `${count === 1 ? "One child missed" : `${count} children missed`} ${meal} on ${formatDate(input.date)}: ${summarizeNames(names)}.`,
        actionPath: "/monitoring/feeding",
        actionLabel: "View feeding records",
        sourceId: input.batchId,
        deduplicationKey: `feeding_missed:${input.batchId}`,
      });
    });
  }

  async publishCredentialDeliveryFailed(input: {
    recipientId: string;
    daycareCenterId: string;
    deliveryAttemptId: string;
    teacherName: string;
  }): Promise<IAdminNotification | null> {
    return this.safelyPublish(
      "credential_delivery_failed",
      input.deliveryAttemptId,
      () =>
        this.publishOperational({
          recipientId: input.recipientId,
          daycareCenterId: input.daycareCenterId,
          eventType: "credential_delivery_failed",
          title: "Credential Delivery Failed",
          message: `Teacher credentials for ${input.teacherName || "the new teacher"} could not be delivered by email.`,
          actionPath: "/monitoring/users",
          actionLabel: "Open user management",
          sourceId: input.deliveryAttemptId,
          deduplicationKey: `credential_delivery_failed:${input.deliveryAttemptId}`,
        }),
    );
  }

  async publishSecurity(
    input: PublishSecurityNotificationInput,
  ): Promise<IAdminNotification | null> {
    return this.safelyPublish(input.eventType, input.sourceId, () =>
      this.createNotification({ ...input, category: "security" }),
    );
  }

  async publishSecurityToActiveCaptain(
    input: Omit<PublishSecurityNotificationInput, "recipientId"> & {
      daycareCenterId: string;
    },
  ): Promise<IAdminNotification | null> {
    return this.safelyPublish(input.eventType, input.sourceId, async () => {
      const captain = await this.dependencies.findActiveCaptainByCenter(
        input.daycareCenterId,
      );
      if (!captain) return null;
      return this.createNotification({
        ...input,
        recipientId: toId(captain._id),
        category: "security",
      });
    });
  }
}

export const adminNotificationService = new AdminNotificationService();

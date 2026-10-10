import type {
  AdminNotificationCategory,
  AdminNotificationEventType,
  IAdminNotification,
} from "../../../models/AdminNotification";

export type AdminNotificationView = "inbox" | "unread" | "archived";

export interface AdminNotificationFeedInput {
  recipientId: string;
  view: AdminNotificationView;
  cursor?: string;
  limit: number;
}

export interface AdminNotificationItem {
  id: string;
  category: AdminNotificationCategory;
  eventType: AdminNotificationEventType;
  title: string;
  message: string;
  actionPath: string;
  actionLabel: string;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AdminNotificationFeedResult {
  items: AdminNotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
}

export interface AdminNotificationCursor {
  createdAt: string;
  id: string;
}

export interface CreateAdminNotificationInput {
  recipientId: string;
  daycareCenterId?: string | null;
  category: AdminNotificationCategory;
  eventType: AdminNotificationEventType;
  title: string;
  message: string;
  actionPath: string;
  actionLabel: string;
  sourceId: string;
  deduplicationKey: string;
  expiresAt: Date;
}

export interface AdminNotificationRepositoryContract {
  createOnce(input: CreateAdminNotificationInput): Promise<IAdminNotification>;
  findFeed(input: {
    recipientId: string;
    view: AdminNotificationView;
    cursor?: { createdAt: Date; id: string };
    limit: number;
    now: Date;
  }): Promise<IAdminNotification[]>;
  countUnread(recipientId: string, now: Date): Promise<number>;
  updateRead(input: {
    recipientId: string;
    notificationId: string;
    read: boolean;
    now: Date;
  }): Promise<IAdminNotification | null>;
  markAllRead(input: {
    recipientId: string;
    now: Date;
  }): Promise<number>;
  updateArchive(input: {
    recipientId: string;
    notificationId: string;
    archived: boolean;
    now: Date;
  }): Promise<IAdminNotification | null>;
}

export interface PublishOperationalNotificationInput {
  daycareCenterId: string;
  eventType: Extract<
    AdminNotificationEventType,
    | "child_enrolled"
    | "attendance_absence"
    | "feeding_missed"
    | "credential_delivery_failed"
  >;
  title: string;
  message: string;
  actionPath: string;
  actionLabel: string;
  sourceId: string;
  deduplicationKey: string;
  recipientId?: string;
}

export interface PublishSecurityNotificationInput {
  recipientId: string;
  daycareCenterId?: string | null;
  eventType: Extract<
    AdminNotificationEventType,
    | "captain_password_changed"
    | "captain_mfa_enabled"
    | "captain_mfa_disabled"
    | "captain_login_email_changed"
    | "captain_username_changed"
    | "captain_invitation_delivery_failed"
    | "captain_account_activated"
  >;
  title: string;
  message: string;
  actionPath: string;
  actionLabel: string;
  sourceId: string;
  deduplicationKey: string;
}

export interface AdminNotificationUser {
  _id: unknown;
  daycareCenter?: unknown;
  adminNotifyOperationalEvents?: boolean;
}

export interface AdminNotificationServiceDependencies {
  repository: AdminNotificationRepositoryContract;
  findCaptainById(id: string): Promise<AdminNotificationUser | null>;
  findActiveCaptainByCenter(
    daycareCenterId: string,
  ): Promise<AdminNotificationUser | null>;
  findChildNamesByIds(ids: string[]): Promise<
    Array<{
      _id: unknown;
      firstName?: string;
      middleName?: string;
      lastName?: string;
    }>
  >;
  now(): Date;
}


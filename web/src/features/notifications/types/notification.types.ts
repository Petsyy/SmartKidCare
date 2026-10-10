export type AdminNotificationView = "inbox" | "unread" | "archived";

export type AdminNotificationCategory = "operational" | "security";

export type AdminNotificationEventType =
  | "child_enrolled"
  | "attendance_absence"
  | "feeding_missed"
  | "credential_delivery_failed"
  | "captain_password_changed"
  | "captain_mfa_enabled"
  | "captain_mfa_disabled"
  | "captain_login_email_changed"
  | "captain_username_changed"
  | "captain_invitation_delivery_failed"
  | "captain_account_activated";

export type AdminNotification = {
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
};

export type AdminNotificationFeedResponse = {
  items: AdminNotification[];
  unreadCount: number;
  nextCursor: string | null;
};


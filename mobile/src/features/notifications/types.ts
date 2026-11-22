import type { ComponentType } from "react";
import type { ArchivedNotificationItem } from "@/src/utils/notification-archive-storage";

export type Platform = "ios" | "android" | "web" | "unknown";

export interface RegisterPushTokenPayload {
  pushToken: string;
  platform?: Platform;
  deviceName?: string | null;
  appOwnership?: string | null;
}

export interface RegisterPushTokenResponse {
  message: string;
  totalTokens: number;
}

export type TeacherNotificationSentType =
  | "attendance_reminder"
  | "attendance_incomplete"
  | "attendance_submitted"
  | "feeding_reminder"
  | "feeding_incomplete"
  | "feeding_submitted";

export interface TeacherNotificationDispatchDetail {
  teacherId: string;
  teacherName: string;
  sent: TeacherNotificationSentType[];
  skipped?: string;
}

export interface TeacherNotificationDispatchResponse {
  message: string;
  date: string;
  totalTeachers: number;
  processedTeachers: number;
  notificationsSent: number;
  attendanceReminderCount: number;
  attendanceIncompleteCount: number;
  feedingReminderCount: number;
  feedingIncompleteCount: number;
  details: TeacherNotificationDispatchDetail[];
}

export interface TeacherNotificationFeedItem {
  id: string;
  type:
    | "attendance_reminder"
    | "attendance_incomplete"
    | "attendance_submitted"
    | "feeding_reminder"
    | "feeding_incomplete"
    | "feeding_submitted";
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface TeacherNotificationFeedResponse {
  message: string;
  date: string;
  teacherId: string;
  teacherName: string;
  hasPushToken: boolean;
  notifications: TeacherNotificationFeedItem[];
}

export interface ParentNotificationFeedItem {
  id: string;
  type:
    | "attendance_submitted"
    | "absence_alert"
    | "feeding_submitted"
    | "missed_meal_alert"
    | "pickup_code_generated"
    | "child_released"
    | "pickup_reminder"
    | "competency_practice";
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
  childId?: string;
  evaluationId?: string;
  actionPath?: string;
}

export interface ParentNotificationFeedResponse {
  message: string;
  date: string;
  parentId: string;
  parentName: string;
  hasPushToken: boolean;
  notifications: ParentNotificationFeedItem[];
}

export type NotificationFeedItem =
  | ParentNotificationFeedItem
  | TeacherNotificationFeedItem;

export type NotificationType = NotificationFeedItem["type"];

export type ArchivedFeedItem = ArchivedNotificationItem<NotificationFeedItem>;

export type NotificationFilter = "all" | "unread" | "archived";

export type NotificationItemBase = {
  id: string;
  type: string;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
  actionPath?: string;
};

export type ArchivedItem<T extends NotificationItemBase> = T & {
  archivedAt: string;
  sourceDate: string;
};

export type CardUI = {
  fallbackTitle: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  accent: string;
};

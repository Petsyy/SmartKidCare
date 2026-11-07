import type { ComponentType } from "react";
import type {
  ParentNotificationFeedItem,
  TeacherNotificationFeedItem,
} from "@/src/api/notifications.api";
import type { ArchivedNotificationItem } from "@/src/utils/notification-archive-storage";

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

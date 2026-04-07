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

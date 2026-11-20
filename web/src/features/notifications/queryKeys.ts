import { webQueryKeys } from "@/lib/query-keys";
import type { AdminNotificationView } from "./types";

export const notificationQueryKeys = {
  root: webQueryKeys.adminNotificationsRoot,
  feed: (userId: string, view: AdminNotificationView) =>
    webQueryKeys.adminNotificationFeed(userId, view),
  unread: webQueryKeys.adminNotificationUnread,
};


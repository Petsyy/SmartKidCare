import { apiRequestOrThrow } from "@/api/api-client";
import type {
  AdminNotification,
  AdminNotificationFeedResponse,
  AdminNotificationView,
} from "@/features/notifications/types/notification.types";

export const getAdminNotificationFeed = async (input: {
  view: AdminNotificationView;
  cursor?: string;
  limit?: number;
}): Promise<AdminNotificationFeedResponse> => {
  const params = new URLSearchParams({
    view: input.view,
    limit: String(input.limit ?? 20),
  });
  if (input.cursor) params.set("cursor", input.cursor);
  return apiRequestOrThrow<AdminNotificationFeedResponse>(
    `/notifications/admin-v1/feed?${params.toString()}`,
    "Unable to load notifications",
  );
};

export const getAdminUnreadNotificationCount = async (): Promise<number> => {
  const result = await getAdminNotificationFeed({
    view: "unread",
    limit: 1,
  });
  return result.unreadCount;
};

export const setAdminNotificationRead = async (
  id: string,
  read: boolean,
): Promise<AdminNotification> => {
  const result = await apiRequestOrThrow<{ notification: AdminNotification }>(
    `/notifications/admin-v1/${id}/read`,
    "Unable to update notification",
    { method: "PATCH", body: { read } },
  );
  return result.notification;
};

export const markAllAdminNotificationsRead = async (): Promise<{
  updatedCount: number;
  unreadCount: 0;
}> =>
  apiRequestOrThrow(
    "/notifications/admin-v1/read-all",
    "Unable to mark notifications as read",
    { method: "PATCH" },
  );

export const setAdminNotificationArchived = async (
  id: string,
  archived: boolean,
): Promise<AdminNotification> => {
  const result = await apiRequestOrThrow<{ notification: AdminNotification }>(
    `/notifications/admin-v1/${id}/archive`,
    "Unable to update notification archive",
    { method: "PATCH", body: { archived } },
  );
  return result.notification;
};


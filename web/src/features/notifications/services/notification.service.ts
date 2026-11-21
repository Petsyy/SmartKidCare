import { apiRequestOrThrow } from "@/api/api-client";
import type {
  AdminNotification,
  AdminNotificationFeedResponse,
  AdminNotificationView,
} from "../types";

export class NotificationService {
  async getAdminNotificationFeed(input: {
    view: AdminNotificationView;
    cursor?: string;
    limit?: number;
  }): Promise<AdminNotificationFeedResponse> {
    const params = new URLSearchParams({
      view: input.view,
      limit: String(input.limit ?? 20),
    });
    if (input.cursor) params.set("cursor", input.cursor);
    return apiRequestOrThrow<AdminNotificationFeedResponse>(
      `/notifications/admin-v1/feed?${params.toString()}`,
      "Unable to load notifications",
    );
  }

  async getAdminUnreadNotificationCount(): Promise<number> {
    const result = await this.getAdminNotificationFeed({
      view: "unread",
      limit: 1,
    });
    return result.unreadCount;
  }

  async setAdminNotificationRead(
    id: string,
    read: boolean,
  ): Promise<AdminNotification> {
    const result = await apiRequestOrThrow<{ notification: AdminNotification }>(
      `/notifications/admin-v1/${id}/read`,
      "Unable to update notification",
      { method: "PATCH", body: { read } },
    );
    return result.notification;
  }

  async markAllAdminNotificationsRead(): Promise<{
    updatedCount: number;
    unreadCount: 0;
  }> {
    return apiRequestOrThrow(
      "/notifications/admin-v1/read-all",
      "Unable to mark notifications as read",
      { method: "PATCH" },
    );
  }

  async setAdminNotificationArchived(
    id: string,
    archived: boolean,
  ): Promise<AdminNotification> {
    const result = await apiRequestOrThrow<{ notification: AdminNotification }>(
      `/notifications/admin-v1/${id}/archive`,
      "Unable to update notification archive",
      { method: "PATCH", body: { archived } },
    );
    return result.notification;
  }
}

export const notificationService = new NotificationService();

// Bound method aliases for backwards compatibility
export const getAdminNotificationFeed = (input: {
  view: AdminNotificationView;
  cursor?: string;
  limit?: number;
}) => notificationService.getAdminNotificationFeed(input);
export const getAdminUnreadNotificationCount = () =>
  notificationService.getAdminUnreadNotificationCount();
export const setAdminNotificationRead = (id: string, read: boolean) =>
  notificationService.setAdminNotificationRead(id, read);
export const markAllAdminNotificationsRead = () =>
  notificationService.markAllAdminNotificationsRead();
export const setAdminNotificationArchived = (id: string, archived: boolean) =>
  notificationService.setAdminNotificationArchived(id, archived);

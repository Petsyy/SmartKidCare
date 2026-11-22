import { apiClient } from "@/src/api/client";
import type {
  RegisterPushTokenPayload,
  RegisterPushTokenResponse,
  TeacherNotificationDispatchResponse,
  TeacherNotificationFeedResponse,
  ParentNotificationFeedResponse,
} from "../types";

export class NotificationService {
  async registerPushToken(
    payload: RegisterPushTokenPayload,
  ): Promise<RegisterPushTokenResponse> {
    return apiClient<RegisterPushTokenResponse>(
      "/api/notifications/register-token",
      { method: "POST", body: payload },
    );
  }

  async dispatchTeacherNotificationsV1(
    payload?: { date?: string },
  ): Promise<TeacherNotificationDispatchResponse> {
    return apiClient<TeacherNotificationDispatchResponse>(
      "/api/notifications/teacher-v1/dispatch",
      { method: "POST", body: payload || {} },
    );
  }

  async getTeacherNotificationsFeed(
    payload?: { date?: string },
  ): Promise<TeacherNotificationFeedResponse> {
    const params = new URLSearchParams();
    if (payload?.date) {
      params.append("date", payload.date);
    }

    const qs = params.toString();
    const path = `/api/notifications/teacher-v1/feed${qs ? `?${qs}` : ""}`;

    return apiClient<TeacherNotificationFeedResponse>(path);
  }

  async getParentNotificationsFeed(
    payload?: { date?: string },
  ): Promise<ParentNotificationFeedResponse> {
    const params = new URLSearchParams();
    if (payload?.date) {
      params.append("date", payload.date);
    }

    const qs = params.toString();
    const path = `/api/notifications/parent-v1/feed${qs ? `?${qs}` : ""}`;

    return apiClient<ParentNotificationFeedResponse>(path);
  }
}

export const notificationService = new NotificationService();

// Backwards-compatible bound aliases
export const registerPushToken = (payload: RegisterPushTokenPayload) =>
  notificationService.registerPushToken(payload);

export const dispatchTeacherNotificationsV1 = (payload?: { date?: string }) =>
  notificationService.dispatchTeacherNotificationsV1(payload);

export const getTeacherNotificationsFeed = (payload?: { date?: string }) =>
  notificationService.getTeacherNotificationsFeed(payload);

export const getParentNotificationsFeed = (payload?: { date?: string }) =>
  notificationService.getParentNotificationsFeed(payload);

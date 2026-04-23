import { apiClient } from "./client";

export type {
  Platform,
  RegisterPushTokenPayload,
  RegisterPushTokenResponse,
  TeacherNotificationDispatchDetail,
  TeacherNotificationDispatchResponse,
  TeacherNotificationFeedItem,
  TeacherNotificationFeedResponse,
  ParentNotificationFeedItem,
  ParentNotificationFeedResponse,
} from "./api.types";

import type {
  RegisterPushTokenPayload,
  RegisterPushTokenResponse,
  TeacherNotificationDispatchResponse,
  TeacherNotificationFeedResponse,
  ParentNotificationFeedResponse,
} from "./api.types";

export const registerPushToken = async (
  payload: RegisterPushTokenPayload,
): Promise<RegisterPushTokenResponse> => {
  return apiClient<RegisterPushTokenResponse>(
    "/api/notifications/register-token",
    { method: "POST", body: payload },
  );
};

export const dispatchTeacherNotificationsV1 = async (
  payload?: { date?: string },
): Promise<TeacherNotificationDispatchResponse> => {
  return apiClient<TeacherNotificationDispatchResponse>(
    "/api/notifications/teacher-v1/dispatch",
    { method: "POST", body: payload || {} },
  );
};

export const getTeacherNotificationsFeed = async (
  payload?: { date?: string },
): Promise<TeacherNotificationFeedResponse> => {
  const params = new URLSearchParams();
  if (payload?.date) {
    params.append("date", payload.date);
  }

  const qs = params.toString();
  const path = `/api/notifications/teacher-v1/feed${qs ? `?${qs}` : ""}`;

  return apiClient<TeacherNotificationFeedResponse>(path);
};

export const getParentNotificationsFeed = async (
  payload?: { date?: string },
): Promise<ParentNotificationFeedResponse> => {
  const params = new URLSearchParams();
  if (payload?.date) {
    params.append("date", payload.date);
  }

  const qs = params.toString();
  const path = `/api/notifications/parent-v1/feed${qs ? `?${qs}` : ""}`;

  return apiClient<ParentNotificationFeedResponse>(path);
};

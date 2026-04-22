import { API_BASE_URL } from "../config/config.api";

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

export const registerPushToken = async (
  token: string,
  payload: RegisterPushTokenPayload,
): Promise<RegisterPushTokenResponse> => {
  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications/register-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to register push token");
  }

  return result;
};

export const dispatchTeacherNotificationsV1 = async (
  token: string,
  payload?: { date?: string },
): Promise<TeacherNotificationDispatchResponse> => {
  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications/teacher-v1/dispatch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload || {}),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to dispatch teacher notifications",
    );
  }

  return result;
};

export const getTeacherNotificationsFeed = async (
  token: string,
  payload?: { date?: string },
): Promise<TeacherNotificationFeedResponse> => {
  if (!token) {
    throw new Error("No authentication token");
  }

  const params = new URLSearchParams();
  if (payload?.date) {
    params.append("date", payload.date);
  }

  const url = `${API_BASE_URL}/api/notifications/teacher-v1/feed${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to fetch teacher notifications feed",
    );
  }

  return result;
};

export const getParentNotificationsFeed = async (
  token: string,
  payload?: { date?: string },
): Promise<ParentNotificationFeedResponse> => {
  if (!token) {
    throw new Error("No authentication token");
  }

  const params = new URLSearchParams();
  if (payload?.date) {
    params.append("date", payload.date);
  }

  const url = `${API_BASE_URL}/api/notifications/parent-v1/feed${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to fetch parent notifications feed",
    );
  }

  return result;
};

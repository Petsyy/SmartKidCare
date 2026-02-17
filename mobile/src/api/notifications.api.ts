import { API_BASE_URL } from "../config/config.api";

type Platform = "ios" | "android" | "web" | "unknown";

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

export interface TeacherNotificationDispatchDetail {
  teacherId: string;
  teacherName: string;
  sent: Array<
    | "attendance_reminder"
    | "attendance_incomplete"
    | "feeding_reminder"
    | "feeding_incomplete"
  >;
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
    | "feeding_reminder"
    | "feeding_incomplete";
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
    | "missed_meal_alert";
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface ParentNotificationFeedResponse {
  message: string;
  date: string;
  parentId: string;
  parentName: string;
  hasPushToken: boolean;
  notifications: ParentNotificationFeedItem[];
}

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

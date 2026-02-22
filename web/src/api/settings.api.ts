import { API_BASE } from "../components/config/config.api";

export type AdminSettingsUser = {
  _id: string;
  username?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "admin" | "teacher" | "parent";
  adminMfaEnabled?: boolean;
  adminNotifySecurityEvents?: boolean;
  adminNotifySystemUpdates?: boolean;
};

type UpdateCurrentUserPayload = {
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type UpdateAdminPreferencesPayload = {
  adminMfaEnabled?: boolean;
  adminNotifySecurityEvents?: boolean;
  adminNotifySystemUpdates?: boolean;
};

const parseError = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return data?.message || data?.error || `Request failed (${response.status})`;
};

export const getCurrentUser = async (): Promise<AdminSettingsUser> => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { user: AdminSettingsUser };
  return data.user;
};

export const updateCurrentUser = async (
  payload: UpdateCurrentUserPayload,
): Promise<AdminSettingsUser> => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { user: AdminSettingsUser };
  return data.user;
};

export const updateAdminPreferences = async (
  payload: UpdateAdminPreferencesPayload,
): Promise<Required<UpdateAdminPreferencesPayload>> => {
  const response = await fetch(`${API_BASE}/auth/me/preferences`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as {
    preferences: Required<UpdateAdminPreferencesPayload>;
  };

  return data.preferences;
};

export const changeCurrentPassword = async (
  currentPassword: string,
  newPassword: string,
  otp: string,
) => {
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword, otp }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
};

export const requestChangePasswordOtp = async (
  currentPassword: string,
  newPassword: string,
) => {
  const response = await fetch(`${API_BASE}/auth/change-password/otp/request`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as {
    message?: string;
    requiresTwoFactor?: boolean;
  };

  return {
    message: data.message || "OTP sent to your email.",
    requiresTwoFactor: data.requiresTwoFactor === true,
  };
};

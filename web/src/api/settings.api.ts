import { apiRequestOrThrow } from "./api-client";

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

export const getCurrentUser = async (): Promise<AdminSettingsUser> => {
  const data = await apiRequestOrThrow<{ user: AdminSettingsUser }>(
    "/auth/me",
    "Failed to fetch current user",
  );
  return data.user;
};

export const updateCurrentUser = async (
  payload: UpdateCurrentUserPayload,
): Promise<AdminSettingsUser> => {
  const data = await apiRequestOrThrow<{ user: AdminSettingsUser }>(
    "/auth/me",
    "Failed to update current user",
    {
      method: "PATCH",
      body: payload,
    },
  );
  return data.user;
};

export const updateAdminPreferences = async (
  payload: UpdateAdminPreferencesPayload,
): Promise<Required<UpdateAdminPreferencesPayload>> => {
  const data = await apiRequestOrThrow<{
    preferences: Required<UpdateAdminPreferencesPayload>;
  }>(
    "/auth/me/preferences",
    "Failed to update admin preferences",
    {
      method: "PATCH",
      body: payload,
    },
  );

  return data.preferences;
};

export const changeCurrentPassword = async (
  currentPassword: string,
  newPassword: string,
  otp: string,
) => {
  await apiRequestOrThrow<unknown>(
    "/auth/change-password",
    "Failed to change password",
    {
      method: "POST",
      body: { currentPassword, newPassword, otp },
    },
  );
};

export const requestChangePasswordOtp = async (
  currentPassword: string,
  newPassword: string,
) => {
  const data = await apiRequestOrThrow<{
    message?: string;
    requiresTwoFactor?: boolean;
  }>(
    "/auth/change-password/otp/request",
    "Failed to request password change OTP",
    {
      method: "POST",
      body: { currentPassword, newPassword },
    },
  );

  return {
    message: data.message || "OTP sent to your email.",
    requiresTwoFactor: data.requiresTwoFactor === true,
  };
};

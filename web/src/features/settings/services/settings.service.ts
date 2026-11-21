import { apiRequestOrThrow } from "@/api/api-client";

export type AdminSettingsUser = {
  _id: string;
  username?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "barangay_captain" | "teacher" | "parent";
  adminMfaEnabled?: boolean;
  adminNotifyOperationalEvents?: boolean;
  adminNotifySecurityEvents?: boolean;
  adminNotifySystemUpdates?: boolean;
};

export type UpdateCurrentUserPayload = {
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export type UpdateAdminPreferencesPayload = {
  adminMfaEnabled?: boolean;
  adminNotifyOperationalEvents?: boolean;
  adminNotifySecurityEvents?: boolean;
  adminNotifySystemUpdates?: boolean;
};

export type SystemSettings = {
  schoolName: string;
  address: string;
};

export class SettingsService {
  async getCurrentUser(): Promise<AdminSettingsUser> {
    const data = await apiRequestOrThrow<{ user: AdminSettingsUser }>(
      "/auth/me",
      "Failed to fetch current user",
    );
    return data.user;
  }

  async updateCurrentUser(
    payload: UpdateCurrentUserPayload,
  ): Promise<AdminSettingsUser> {
    const data = await apiRequestOrThrow<{ user: AdminSettingsUser }>(
      "/auth/me",
      "Failed to update current user",
      {
        method: "PATCH",
        body: payload,
      },
    );
    return data.user;
  }

  async updateAdminPreferences(
    payload: UpdateAdminPreferencesPayload,
  ): Promise<Required<UpdateAdminPreferencesPayload>> {
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
  }

  async changeCurrentPassword(
    currentPassword: string,
    newPassword: string,
    otp: string,
  ): Promise<void> {
    await apiRequestOrThrow<unknown>(
      "/auth/change-password",
      "Failed to change password",
      {
        method: "POST",
        body: { currentPassword, newPassword, otp },
      },
    );
  }

  async requestChangePasswordOtp(
    currentPassword: string,
    newPassword: string,
  ): Promise<{
    message: string;
    requiresTwoFactor: boolean;
  }> {
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
      message: data.message || "OTP sent successfully",
      requiresTwoFactor: Boolean(data.requiresTwoFactor),
    };
  }

  async getSystemSettings(): Promise<SystemSettings> {
    const data = await apiRequestOrThrow<{ data: SystemSettings }>(
      "/settings",
      "Failed to fetch system settings",
    );
    return data.data;
  }

  async updateSystemSettings(
    payload: Partial<SystemSettings>,
  ): Promise<SystemSettings> {
    const data = await apiRequestOrThrow<{ data: SystemSettings }>(
      "/settings",
      "Failed to update system settings",
      {
        method: "PUT",
        body: payload,
      },
    );
    return data.data;
  }
}

export const settingsService = new SettingsService();

// Bound method aliases for backwards compatibility
export const getCurrentUser = () => settingsService.getCurrentUser();
export const updateCurrentUser = (payload: UpdateCurrentUserPayload) =>
  settingsService.updateCurrentUser(payload);
export const updateAdminPreferences = (payload: UpdateAdminPreferencesPayload) =>
  settingsService.updateAdminPreferences(payload);
export const changeCurrentPassword = (
  currentPassword: string,
  newPassword: string,
  otp: string,
) => settingsService.changeCurrentPassword(currentPassword, newPassword, otp);
export const requestChangePasswordOtp = (
  currentPassword: string,
  newPassword: string,
) => settingsService.requestChangePasswordOtp(currentPassword, newPassword);
export const getSystemSettings = () => settingsService.getSystemSettings();
export const updateSystemSettings = (payload: Partial<SystemSettings>) =>
  settingsService.updateSystemSettings(payload);

import { useCallback, useEffect, useState } from "react";
import {
  changeCurrentPassword,
  getCurrentUser,
  requestChangePasswordOtp,
  updateAdminPreferences,
  updateCurrentUser,
} from "@/api/settings.api";

export type AdminProfileForm = {
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type AdminPreferencesForm = {
  adminMfaEnabled: boolean;
  adminNotifySecurityEvents: boolean;
  adminNotifySystemUpdates: boolean;
};

const DEFAULT_PROFILE: AdminProfileForm = {
  username: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
};

const DEFAULT_PREFERENCES: AdminPreferencesForm = {
  adminMfaEnabled: true,
  adminNotifySecurityEvents: true,
  adminNotifySystemUpdates: true,
};

const mapProfile = (user: any): AdminProfileForm => ({
  username: String(user?.username || ""),
  firstName: String(user?.firstName || ""),
  middleName: String(user?.middleName || ""),
  lastName: String(user?.lastName || ""),
  email: String(user?.email || ""),
  phone: String(user?.phone || ""),
});

const mapPreferences = (user: any): AdminPreferencesForm => ({
  adminMfaEnabled: user?.adminMfaEnabled !== false,
  adminNotifySecurityEvents: user?.adminNotifySecurityEvents !== false,
  adminNotifySystemUpdates: user?.adminNotifySystemUpdates !== false,
});

export function useAdminSettings() {
  const [profile, setProfile] = useState<AdminProfileForm>(DEFAULT_PROFILE);
  const [preferences, setPreferences] =
    useState<AdminPreferencesForm>(DEFAULT_PREFERENCES);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const user = await getCurrentUser();
      setIsAdmin(user.role === "admin");
      setProfile(mapProfile(user));
      setPreferences(mapPreferences(user));
    } catch (error: any) {
      setLoadError(error?.message || "Failed to load admin settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveProfile = async (nextProfile: AdminProfileForm) => {
    const payload = {
      username: nextProfile.username.trim(),
      firstName: nextProfile.firstName.trim(),
      middleName: nextProfile.middleName.trim(),
      lastName: nextProfile.lastName.trim(),
      email: nextProfile.email.trim(),
      phone: nextProfile.phone.trim(),
    };

    const user = await updateCurrentUser(payload);
    const mappedProfile = mapProfile(user);
    setProfile(mappedProfile);

    if (mappedProfile.email) {
      localStorage.setItem("adminEmail", mappedProfile.email);
    }

    return mappedProfile;
  };

  const savePreferences = async (nextPreferences: AdminPreferencesForm) => {
    const saved = await updateAdminPreferences(nextPreferences);
    const mappedPreferences: AdminPreferencesForm = {
      adminMfaEnabled: saved.adminMfaEnabled,
      adminNotifySecurityEvents: saved.adminNotifySecurityEvents,
      adminNotifySystemUpdates: saved.adminNotifySystemUpdates,
    };

    setPreferences(mappedPreferences);
    return mappedPreferences;
  };

  const sendPasswordChangeOtp = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    return requestChangePasswordOtp(currentPassword, newPassword);
  };

  const savePassword = async (
    currentPassword: string,
    newPassword: string,
    otp: string,
  ) => {
    await changeCurrentPassword(currentPassword, newPassword, otp);
  };

  return {
    profile,
    setProfile,
    preferences,
    setPreferences,
    isAdmin,
    isLoading,
    loadError,
    loadSettings,
    saveProfile,
    savePreferences,
    sendPasswordChangeOtp,
    savePassword,
  };
}

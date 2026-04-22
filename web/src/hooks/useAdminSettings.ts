import { useState } from "react";
import {
  changeCurrentPassword,
  getCurrentUser,
  requestChangePasswordOtp,
  updateAdminPreferences,
  updateCurrentUser,
} from "@/api/settings.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";

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
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<AdminProfileForm>(DEFAULT_PROFILE);
  const [preferences, setPreferences] =
    useState<AdminPreferencesForm>(DEFAULT_PREFERENCES);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: webQueryKeys.adminSettings(),
    queryFn: async () => {
      const user = await getCurrentUser();
      const mappedProfile = mapProfile(user);
      const mappedPreferences = mapPreferences(user);
      setProfile(mappedProfile);
      setPreferences(mappedPreferences);
      return {
        isAdmin: user.role === "admin",
        profile: mappedProfile,
        preferences: mappedPreferences,
      };
    },
  });
  const isAdmin = data?.isAdmin ?? false;
  const loadError = error instanceof Error ? error.message : null;
  const profileMutation = useMutation({
    mutationFn: async (nextProfile: AdminProfileForm) => {
      const payload = {
        username: nextProfile.username.trim(),
        firstName: nextProfile.firstName.trim(),
        middleName: nextProfile.middleName.trim(),
        lastName: nextProfile.lastName.trim(),
        email: nextProfile.email.trim(),
        phone: nextProfile.phone.trim(),
      };
      return updateCurrentUser(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webQueryKeys.adminSettings() });
      await queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
    },
  });
  const preferencesMutation = useMutation({
    mutationFn: (nextPreferences: AdminPreferencesForm) =>
      updateAdminPreferences(nextPreferences),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webQueryKeys.adminSettings() });
    },
  });

  const saveProfile = async (nextProfile: AdminProfileForm) => {
    const user = await profileMutation.mutateAsync(nextProfile);
    const mappedProfile = mapProfile(user);
    setProfile(mappedProfile);

    return mappedProfile;
  };

  const savePreferences = async (nextPreferences: AdminPreferencesForm) => {
    const saved = await preferencesMutation.mutateAsync(nextPreferences);
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
    loadSettings: refetch,
    saveProfile,
    savePreferences,
    sendPasswordChangeOtp,
    savePassword,
  };
}

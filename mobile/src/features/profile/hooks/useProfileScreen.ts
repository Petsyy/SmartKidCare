import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter, useFocusEffect, usePathname } from "expo-router";
import { useAuthContext } from "@/src/context/auth-context";
import { API_BASE_URL } from "@/src/config/config.api";
import {
  getPasswordStrengthFeedback,
  validatePasswordRules,
} from "@/src/validations/password-validation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useProfileUiStore } from "@/src/features/profile/stores/profile-ui.store";
import { useTeacherUiStore } from "@/src/features/teacher/stores/teacher-ui.store";

export type ProfileRole = "parent" | "teacher";

export type UserProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  role: string;
  phone?: string;
  employeeId?: string;
  isActive?: boolean;
  daycareCenter?:
    | {
        _id?: string;
        name?: string;
        barangay?: string;
        code?: string;
        isActive?: boolean;
      }
    | string
    | null;
  assignedCenter?: string;
};

type Params = {
  fetchProfile: (token: string) => Promise<UserProfile>;
};

export function useProfileScreen({ fetchProfile }: Params) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, token } = useAuthContext();
  const profileRole: ProfileRole = pathname.includes("(teacher)")
    ? "teacher"
    : "parent";
  const { data: profile = null, isLoading: loading, refetch } = useQuery({
    queryKey: mobileQueryKeys.profile(token, profileRole),
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      return fetchProfile(token);
    },
  });
  const {
    showPasswordModal,
    showHelpModal,
    setShowPasswordModal,
    setShowHelpModal,
  } = useProfileUiStore();
  const resetTeacherUi = useTeacherUiStore((state) => state.resetTeacherUi);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hideCurrentPassword, setHideCurrentPassword] = useState(true);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }
      return data;
    },
  });
  const passwordLoading = changePasswordMutation.isPending;

  useFocusEffect(
    useMemo(
      () =>
        () => {
          void refetch();
        },
      [refetch],
    ),
  );

  const passwordFeedback = useMemo(
    () => getPasswordStrengthFeedback(newPassword),
    [newPassword],
  );

  const isPasswordsMatching =
    newPassword && confirmPassword && newPassword === confirmPassword;
  const isPasswordStrong = passwordFeedback.label === "Strong";
  const isChangePasswordFormValid =
    currentPassword && isPasswordStrong && isPasswordsMatching;

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          resetTeacherUi();
          logout();
          router.push("/(auth)/login");
        },
        style: "destructive",
      },
    ]);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const passwordValidation = validatePasswordRules(newPassword);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || "Invalid password");
      return;
    }

    if (!isPasswordStrong) {
      setPasswordError("Password must be strong");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      Alert.alert("Success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHideCurrentPassword(true);
      setHideNewPassword(true);
      setHideConfirmPassword(true);
      setShowPasswordModal(false);
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password");
    }
  };

  return {
    profile,
    loading,
    showPasswordModal,
    setShowPasswordModal,
    showHelpModal,
    setShowHelpModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    hideCurrentPassword,
    setHideCurrentPassword,
    hideNewPassword,
    setHideNewPassword,
    hideConfirmPassword,
    setHideConfirmPassword,
    passwordError,
    passwordLoading,
    passwordFeedback,
    isChangePasswordFormValid,
    handleLogout,
    handleChangePassword,
  };
}

import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthContext } from "@/src/context/auth-context";
import { API_BASE_URL } from "@/src/config/config.api";
import {
  getPasswordStrengthFeedback,
  validatePasswordRules,
} from "@/src/validations/password-validation";

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
  const { logout, token } = useAuthContext();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hideCurrentPassword, setHideCurrentPassword] = useState(true);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useFocusEffect(
    useMemo(
      () =>
        () => {
          const run = async () => {
            try {
              if (token) {
                const profileData = await fetchProfile(token);
                setProfile(profileData);
              }
            } catch (error) {
              console.error("Failed to fetch profile:", error);
            } finally {
              setLoading(false);
            }
          };

          void run();
        },
      [fetchProfile, token],
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

    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

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
    } finally {
      setPasswordLoading(false);
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

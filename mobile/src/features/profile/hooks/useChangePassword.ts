import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/src/api/authentication.api";
import {
  getPasswordStrengthFeedback,
  validatePasswordRules,
} from "@/src/validations/password-validation";

export function useChangePassword(onDismissModal: () => void) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [hideCurrentPassword, setHideCurrentPassword] = useState(true);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      return changePassword(payload);
    },
  });

  const passwordLoading = changePasswordMutation.isPending;

  const passwordFeedback = useMemo(
    () => getPasswordStrengthFeedback(newPassword),
    [newPassword],
  );

  const isPasswordsMatching = Boolean(
    newPassword && confirmPassword && newPassword === confirmPassword
  );
  
  const isPasswordStrong = passwordFeedback.label === "Strong";
  
  const isChangePasswordFormValid = Boolean(
    currentPassword && isPasswordStrong && isPasswordsMatching
  );

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
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });

      Alert.alert("Success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHideCurrentPassword(true);
      setHideNewPassword(true);
      setHideConfirmPassword(true);
      onDismissModal();
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password");
    }
  };

  return {
    currentPassword, setCurrentPassword, newPassword, setNewPassword,
    confirmPassword, setConfirmPassword, hideCurrentPassword, setHideCurrentPassword,
    hideNewPassword, setHideNewPassword, hideConfirmPassword, setHideConfirmPassword,
    passwordError, passwordLoading, passwordFeedback,
    isChangePasswordFormValid, handleChangePassword,
  };
}

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordChangeFormSchema } from "../validations";
import { showAdminPasswordChangedModal } from "@/utils/alerts";
import { DEFAULT_PASSWORD_FORM } from "../constants/sections";
import { useAdminPassword2FA } from "./useAdminPassword2FA";
import type { PasswordForm, UseAdminSecurityFormProps } from "../types";

export function useAdminSecurityForm({
  sendPasswordChangeOtp,
  savePassword,
}: UseAdminSecurityFormProps) {
  const {
    passwordState,
    passwordOtpState,
    passwordFieldErrors,
    securityStatus,
    getPasswordPolicyChecks,
    canRequestPasswordOtp,
    canSubmitPasswordChange,
    handlePasswordInputChange,
    handleRequestPasswordOtp,
    handlePasswordSubmit,
  } = useAdminPassword2FA({
    sendPasswordChangeOtp,
    savePassword,
    onPasswordChanged: async () => {
      await showAdminPasswordChangedModal();
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: DEFAULT_PASSWORD_FORM,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { reset: resetPasswordForm } = passwordForm;

  useEffect(() => {
    if (passwordState.success) {
      resetPasswordForm(DEFAULT_PASSWORD_FORM);
    }
  }, [passwordState.success, resetPasswordForm]);

  const onSubmitSecurity = async (form: PasswordForm) => {
    const changed = await handlePasswordSubmit(form);
    if (changed) {
      resetPasswordForm(DEFAULT_PASSWORD_FORM);
    }
  };

  const watchedPasswordFormValues = useWatch({
    control: passwordForm.control,
    defaultValue: DEFAULT_PASSWORD_FORM,
  });

  const passwordFormValues: PasswordForm = {
    currentPassword: watchedPasswordFormValues.currentPassword ?? "",
    newPassword: watchedPasswordFormValues.newPassword ?? "",
    confirmPassword: watchedPasswordFormValues.confirmPassword ?? "",
    otp: watchedPasswordFormValues.otp ?? "",
  };

  const passwordPolicyChecks = getPasswordPolicyChecks(passwordFormValues);
  const canRequestPasswordOtpValue = canRequestPasswordOtp(passwordFormValues);
  const canSubmitPasswordChangeValue =
    canSubmitPasswordChange(passwordFormValues);

  return {
    passwordForm,
    passwordState,
    passwordOtpState,
    passwordFieldErrors,
    securityStatus,
    passwordPolicyChecks,
    canRequestPasswordOtpValue,
    canSubmitPasswordChangeValue,
    handlePasswordInputChange,
    handleRequestPasswordOtp,
    onSubmitSecurity,
  };
}

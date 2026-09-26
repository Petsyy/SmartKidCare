import { useMemo, useState } from "react";
import {
  PASSWORD_MIN_LENGTH,
  hasLowercaseRegex,
  hasNumberRegex,
  hasSpecialCharacterRegex,
  startsWithUppercaseRegex,
} from "@/utils/password-policy";
import {
  passwordChangeFormSchema,
  passwordChangeRequestSchema,
  type PasswordChangeFormValues,
} from "@/features/auth/validations/auth.validation";

type SendPasswordChangeOtp = (
  currentPassword: string,
  newPassword: string,
) => Promise<{ message: string; requiresTwoFactor: boolean }>;

type SavePassword = (
  currentPassword: string,
  newPassword: string,
  otp: string,
) => Promise<void>;

type UseAdminPassword2FAOptions = {
  sendPasswordChangeOtp: SendPasswordChangeOtp;
  savePassword: SavePassword;
  onPasswordChanged?: () => void | Promise<void>;
};

export type PasswordForm = PasswordChangeFormValues;

export type PasswordFieldErrors = Partial<Record<keyof PasswordForm, string>>;

export type PasswordState = {
  saving: boolean;
  success: string | null;
  error: string | null;
};

export type PasswordOtpState = {
  requesting: boolean;
  sent: boolean;
  info: string | null;
  error: string | null;
};

type PasswordPolicyChecks = {
  minimumLength: boolean;
  startsWithUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialCharacter: boolean;
  differsFromCurrent: boolean;
  matchesConfirmation: boolean;
};

const INITIAL_PASSWORD_STATE: PasswordState = {
  saving: false,
  success: null,
  error: null,
};

const INITIAL_PASSWORD_OTP_STATE: PasswordOtpState = {
  requesting: false,
  sent: false,
  info: null,
  error: null,
};

type PasswordValidationIssue = {
  field: keyof PasswordForm;
  message: string;
};

const getPasswordPolicyChecks = (form: PasswordForm): PasswordPolicyChecks => ({
  minimumLength: form.newPassword.length >= PASSWORD_MIN_LENGTH,
  startsWithUppercase: startsWithUppercaseRegex.test(form.newPassword),
  hasLowercase: hasLowercaseRegex.test(form.newPassword),
  hasNumber: hasNumberRegex.test(form.newPassword),
  hasSpecialCharacter: hasSpecialCharacterRegex.test(form.newPassword),
  differsFromCurrent:
    form.currentPassword.length > 0 &&
    form.newPassword.length > 0 &&
    form.currentPassword !== form.newPassword,
  matchesConfirmation:
    form.newPassword.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword,
});

const validatePasswordForm = (
  form: PasswordForm,
  requireOtp: boolean,
): PasswordValidationIssue | null => {
  const result = requireOtp
    ? passwordChangeFormSchema.safeParse(form)
    : passwordChangeRequestSchema.safeParse(form);

  if (result.success) return null;

  const issue = result.error.issues[0];
  const field = issue?.path[0];
  if (
    field !== "currentPassword" &&
    field !== "newPassword" &&
    field !== "confirmPassword" &&
    field !== "otp"
  ) {
    return null;
  }

  return { field, message: issue.message };
};

const getBackendErrorField = (message: string): keyof PasswordForm | null => {
  const lower = String(message || "").toLowerCase();
  if (lower.includes("current password")) {
    return "currentPassword";
  }
  if (
    lower.includes("new password") ||
    lower.includes("must start with a capital") ||
    lower.includes("special character") ||
    lower.includes("lowercase letter") ||
    lower.includes("include at least one number")
  ) {
    return "newPassword";
  }
  if (lower.includes("confirmation")) {
    return "confirmPassword";
  }
  if (lower.includes("otp")) {
    return "otp";
  }
  return null;
};

export function useAdminPassword2FA({
  sendPasswordChangeOtp,
  savePassword,
  onPasswordChanged,
}: UseAdminPassword2FAOptions) {
  const [passwordState, setPasswordState] = useState<PasswordState>(
    INITIAL_PASSWORD_STATE,
  );
  const [passwordOtpState, setPasswordOtpState] = useState<PasswordOtpState>(
    INITIAL_PASSWORD_OTP_STATE,
  );
  const [passwordFieldErrors, setPasswordFieldErrors] =
    useState<PasswordFieldErrors>({});

  const securityStatus = useMemo(
    () =>
      passwordOtpState.sent
        ? "OTP pending verification"
        : passwordState.success
          ? "Recently updated"
          : "Password controls",
    [passwordOtpState.sent, passwordState.success],
  );

  const canRequestPasswordOtp = (form: PasswordForm) =>
    validatePasswordForm(form, false) === null;

  const canSubmitPasswordChange = (form: PasswordForm) =>
    passwordOtpState.sent && validatePasswordForm(form, true) === null;

  const handlePasswordInputChange = (key: keyof PasswordForm) => {
    setPasswordState(INITIAL_PASSWORD_STATE);
    setPasswordFieldErrors({});

    setPasswordOtpState((previous) => {
      if (key === "otp") {
        return {
          ...previous,
          error: null,
        };
      }

      return {
        requesting: false,
        sent: false,
        info: null,
        error: previous.sent
          ? "Password fields changed. Request a new OTP."
          : null,
      };
    });
  };

  const handleRequestPasswordOtp = async (form: PasswordForm) => {
    const validationIssue = validatePasswordForm(form, false);
    if (validationIssue) {
      setPasswordFieldErrors({
        [validationIssue.field]: validationIssue.message,
      });
      setPasswordOtpState({
        requesting: false,
        sent: false,
        info: null,
        error: null,
      });
      return;
    }

    setPasswordState(INITIAL_PASSWORD_STATE);
    setPasswordFieldErrors({});
    setPasswordOtpState((previous) => ({
      requesting: true,
      sent: previous.sent,
      info: null,
      error: null,
    }));

    try {
      const response = await sendPasswordChangeOtp(
        form.currentPassword,
        form.newPassword,
      );
      setPasswordOtpState({
        requesting: false,
        sent: true,
        info: response.message,
        error: null,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send OTP.";
      const field = getBackendErrorField(message);
      setPasswordFieldErrors(field ? { [field]: message } : {});
      setPasswordOtpState((previous) => ({
        requesting: false,
        sent: previous.sent,
        info: null,
        error: field ? null : message,
      }));
    }
  };

  const handlePasswordSubmit = async (form: PasswordForm) => {
    const baseValidationIssue = validatePasswordForm(form, false);
    if (baseValidationIssue) {
      setPasswordFieldErrors({
        [baseValidationIssue.field]: baseValidationIssue.message,
      });
      setPasswordState({
        saving: false,
        success: null,
        error: null,
      });
      return false;
    }

    if (!passwordOtpState.sent) {
      setPasswordFieldErrors({});
      setPasswordState({
        saving: false,
        success: null,
        error: "Request OTP first before changing your password.",
      });
      return false;
    }

    const otpValidationIssue = validatePasswordForm(form, true);
    if (otpValidationIssue) {
      setPasswordFieldErrors({
        [otpValidationIssue.field]: otpValidationIssue.message,
      });
      setPasswordState({
        saving: false,
        success: null,
        error: null,
      });
      return false;
    }

    setPasswordFieldErrors({});
    setPasswordState({
      saving: true,
      success: null,
      error: null,
    });

    try {
      await savePassword(form.currentPassword, form.newPassword, form.otp.trim());

      setPasswordOtpState(INITIAL_PASSWORD_OTP_STATE);
      setPasswordFieldErrors({});
      setPasswordState({
        saving: false,
        success: "Password changed successfully.",
        error: null,
      });

      if (onPasswordChanged) {
        await onPasswordChanged();
      }
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to change password.";
      const field = getBackendErrorField(message);
      setPasswordFieldErrors(field ? { [field]: message } : {});
      setPasswordState({
        saving: false,
        success: null,
        error: field ? null : message,
      });
      return false;
    }
  };

  return {
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
  };
}

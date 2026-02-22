import { useMemo, useState, type FormEvent } from "react";

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

export type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  otp: string;
};

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
  hasSpecialCharacter: boolean;
  differsFromCurrent: boolean;
  matchesConfirmation: boolean;
};

const PASSWORD_MIN_LENGTH = 8;
const startsWithUppercaseRegex = /^[A-Z]/;
const hasSpecialCharacterRegex = /[^A-Za-z0-9]/;
const otpRegex = /^\d{6}$/;

const INITIAL_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  otp: "",
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

export function useAdminPassword2FA({
  sendPasswordChangeOtp,
  savePassword,
  onPasswordChanged,
}: UseAdminPassword2FAOptions) {
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(
    INITIAL_PASSWORD_FORM,
  );
  const [passwordState, setPasswordState] = useState<PasswordState>(
    INITIAL_PASSWORD_STATE,
  );
  const [passwordOtpState, setPasswordOtpState] = useState<PasswordOtpState>(
    INITIAL_PASSWORD_OTP_STATE,
  );
  const [passwordFieldErrors, setPasswordFieldErrors] =
    useState<PasswordFieldErrors>({});

  const validatePasswordForm = (
    form: PasswordForm,
    requireOtp: boolean,
  ): PasswordValidationIssue | null => {
    if (!form.currentPassword.trim()) {
      return {
        field: "currentPassword",
        message: "Current password is required.",
      };
    }
    if (!form.newPassword.trim()) {
      return {
        field: "newPassword",
        message: "New password is required.",
      };
    }
    if (form.newPassword.length < PASSWORD_MIN_LENGTH) {
      return {
        field: "newPassword",
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      };
    }
    if (!startsWithUppercaseRegex.test(form.newPassword)) {
      return {
        field: "newPassword",
        message: "Password must start with a capital letter.",
      };
    }
    if (!hasSpecialCharacterRegex.test(form.newPassword)) {
      return {
        field: "newPassword",
        message: "Password must include at least one special character.",
      };
    }
    if (form.newPassword === form.currentPassword) {
      return {
        field: "newPassword",
        message: "New password must be different from current password.",
      };
    }
    if (!form.confirmPassword.trim()) {
      return {
        field: "confirmPassword",
        message: "Please confirm your new password.",
      };
    }
    if (form.newPassword !== form.confirmPassword) {
      return {
        field: "confirmPassword",
        message: "New password and confirmation do not match.",
      };
    }
    if (requireOtp) {
      if (!form.otp.trim()) {
        return {
          field: "otp",
          message: "OTP is required.",
        };
      }
      if (!otpRegex.test(form.otp.trim())) {
        return {
          field: "otp",
          message: "OTP must be a 6-digit code.",
        };
      }
    }
    return null;
  };

  const getBackendErrorField = (message: string): keyof PasswordForm | null => {
    const lower = String(message || "").toLowerCase();
    if (lower.includes("current password")) {
      return "currentPassword";
    }
    if (
      lower.includes("new password") ||
      lower.includes("must start with a capital") ||
      lower.includes("special character")
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

  const passwordPolicyChecks: PasswordPolicyChecks = useMemo(
    () => ({
      minimumLength: passwordForm.newPassword.length >= PASSWORD_MIN_LENGTH,
      startsWithUppercase: startsWithUppercaseRegex.test(
        passwordForm.newPassword,
      ),
      hasSpecialCharacter: hasSpecialCharacterRegex.test(
        passwordForm.newPassword,
      ),
      differsFromCurrent:
        passwordForm.currentPassword.length > 0 &&
        passwordForm.newPassword.length > 0 &&
        passwordForm.currentPassword !== passwordForm.newPassword,
      matchesConfirmation:
        passwordForm.newPassword.length > 0 &&
        passwordForm.confirmPassword.length > 0 &&
        passwordForm.newPassword === passwordForm.confirmPassword,
    }),
    [passwordForm],
  );

  const canRequestPasswordOtp =
    validatePasswordForm(passwordForm, false) === null;
  const canSubmitPasswordChange =
    passwordOtpState.sent && validatePasswordForm(passwordForm, true) === null;

  const securityStatus = passwordOtpState.sent
    ? "OTP pending verification"
    : passwordState.success
      ? "Recently updated"
      : "Password controls";

  const handlePasswordFieldChange = (
    key: keyof PasswordForm,
    value: string,
  ) => {
    setPasswordForm((previous) => {
      const next = { ...previous, [key]: value };
      if (key !== "otp") {
        next.otp = "";
      }
      return next;
    });

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

  const handleRequestPasswordOtp = async () => {
    const validationIssue = validatePasswordForm(passwordForm, false);
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
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      setPasswordOtpState({
        requesting: false,
        sent: true,
        info: response.message,
        error: null,
      });
    } catch (error: any) {
      const message = error?.message || "Failed to send OTP.";
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

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const baseValidationIssue = validatePasswordForm(passwordForm, false);
    if (baseValidationIssue) {
      setPasswordFieldErrors({
        [baseValidationIssue.field]: baseValidationIssue.message,
      });
      setPasswordState({
        saving: false,
        success: null,
        error: null,
      });
      return;
    }

    if (!passwordOtpState.sent) {
      setPasswordFieldErrors({});
      setPasswordState({
        saving: false,
        success: null,
        error: "Request OTP first before changing your password.",
      });
      return;
    }

    const otpValidationIssue = validatePasswordForm(passwordForm, true);
    if (otpValidationIssue) {
      setPasswordFieldErrors({
        [otpValidationIssue.field]: otpValidationIssue.message,
      });
      setPasswordState({
        saving: false,
        success: null,
        error: null,
      });
      return;
    }

    setPasswordFieldErrors({});
    setPasswordState({
      saving: true,
      success: null,
      error: null,
    });

    try {
      await savePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.otp.trim(),
      );

      setPasswordForm(INITIAL_PASSWORD_FORM);
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
    } catch (error: any) {
      const message = error?.message || "Failed to change password.";
      const field = getBackendErrorField(message);
      setPasswordFieldErrors(field ? { [field]: message } : {});
      setPasswordState({
        saving: false,
        success: null,
        error: field ? null : message,
      });
    }
  };

  return {
    passwordForm,
    passwordState,
    passwordOtpState,
    passwordFieldErrors,
    passwordPolicyChecks,
    canRequestPasswordOtp,
    canSubmitPasswordChange,
    securityStatus,
    handlePasswordFieldChange,
    handleRequestPasswordOtp,
    handlePasswordSubmit,
  };
}

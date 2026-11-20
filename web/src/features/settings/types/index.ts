import type { LucideIcon } from "lucide-react";
import type { PasswordChangeFormValues } from "@/features/auth";

export type SettingsSectionId =
  | "profile"
  | "security"
  | "preferences"
  | "system";

export interface SettingsSection {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
}

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
  adminNotifyOperationalEvents: boolean;
  adminNotifySecurityEvents: boolean;
  adminNotifySystemUpdates: boolean;
};

export type SendPasswordChangeOtp = (
  currentPassword: string,
  newPassword: string,
) => Promise<{ message: string; requiresTwoFactor: boolean }>;

export type SavePassword = (
  currentPassword: string,
  newPassword: string,
  otp: string,
) => Promise<void>;

export type UseAdminPassword2FAOptions = {
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

export type PasswordPolicyChecks = {
  minimumLength: boolean;
  startsWithUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialCharacter: boolean;
  differsFromCurrent: boolean;
  matchesConfirmation: boolean;
};

export type PasswordValidationIssue = {
  field: keyof PasswordForm;
  message: string;
};

export interface UseAdminProfileFormProps {
  profile: AdminProfileForm;
  saveProfile: (form: AdminProfileForm) => Promise<AdminProfileForm>;
}

export interface UseAdminPreferencesManagerProps {
  preferences: AdminPreferencesForm;
  setPreferences: React.Dispatch<React.SetStateAction<AdminPreferencesForm>>;
  savePreferences: (form: AdminPreferencesForm) => Promise<AdminPreferencesForm>;
}

export interface UseAdminSecurityFormProps {
  sendPasswordChangeOtp: SendPasswordChangeOtp;
  savePassword: SavePassword;
}

export type SystemSettingsForm = {
  schoolName: string;
  address: string;
};

export type SystemSettingsStatus = {
  saving: boolean;
  error: string | null;
  success: string | null;
};


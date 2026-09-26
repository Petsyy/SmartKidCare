import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PasswordForm } from "@/features/settings/hooks/useAdminPassword2FA";
import { PasswordVisibilityButton } from "@/components/ui/PasswordVisibilityButton";
import {
  AUTH_OTP_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  sanitizeNoWhitespace,
  sanitizeOtp,
} from "@/features/auth/validations/auth.validation";

const LABEL_CLASS_NAME =
  "mb-2 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200 ml-1";
const INPUT_CLASS_NAME =
  "w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15 disabled:cursor-not-allowed disabled:bg-slate-100/80 disabled:text-slate-400 disabled:shadow-none read-only:cursor-not-allowed read-only:bg-slate-100/80 read-only:text-slate-400 read-only:shadow-none dark:border-white/10 dark:bg-[#0A101D]/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-teal-500/50 dark:focus:bg-[#0A101D] dark:focus:ring-teal-500/20 dark:disabled:bg-slate-900/80 dark:disabled:text-slate-600 dark:read-only:bg-slate-900/80 dark:read-only:text-slate-600";

type SecuritySectionProps = {
  form: UseFormReturn<PasswordForm>;
  passwordState: { saving: boolean; success: string | null; error: string | null };
  passwordOtpState: { requesting: boolean; sent: boolean; error: string | null; info: string | null };
  passwordFieldErrors: Record<string, string | undefined>;
  passwordPolicyChecks: Record<string, boolean>;
  canRequestPasswordOtpValue: boolean;
  canSubmitPasswordChangeValue: boolean;
  onSubmit: (form: PasswordForm) => void;
  onPasswordInputChange: (field: keyof PasswordForm) => void;
  onRequestOtp: (form: PasswordForm) => void;
};

export const SecuritySection = ({
  form,
  passwordState,
  passwordOtpState,
  passwordFieldErrors,
  passwordPolicyChecks,
  canRequestPasswordOtpValue,
  canSubmitPasswordChangeValue,
  onSubmit,
  onPasswordInputChange,
  onRequestOtp,
}: SecuritySectionProps) => {
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const { register, handleSubmit, setValue, watch, formState } = form;
  const preventWhitespaceInput = (event: FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = sanitizeNoWhitespace(event.currentTarget.value);
  };

  const fieldError = (field: keyof PasswordForm) =>
    formState.errors[field]?.message || passwordFieldErrors[field];
  const togglePasswordVisibility = (field: keyof typeof visiblePasswords) => {
    setVisiblePasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <label className={LABEL_CLASS_NAME}>Current Password</label>
          <div className="relative">
            <input
              id="settings-current-password"
              type={visiblePasswords.currentPassword ? "text" : "password"}
              className={`${INPUT_CLASS_NAME} pr-12`}
              placeholder="Current password"
              maxLength={AUTH_PASSWORD_MAX_LENGTH}
              onInput={preventWhitespaceInput}
              aria-invalid={Boolean(fieldError("currentPassword"))}
              {...register("currentPassword", {
                onChange: () => onPasswordInputChange("currentPassword"),
              })}
            />
            <PasswordVisibilityButton
              visible={visiblePasswords.currentPassword}
              onToggle={() => togglePasswordVisibility("currentPassword")}
              inputId="settings-current-password"
              label="current password"
              disabled={passwordState.saving}
            />
          </div>
          {fieldError("currentPassword") && (
            <p className="mt-1 text-xs text-red-600">
              {fieldError("currentPassword")}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>New Password</label>
          <div className="relative">
            <input
              id="settings-new-password"
              type={visiblePasswords.newPassword ? "text" : "password"}
              className={`${INPUT_CLASS_NAME} pr-12`}
              placeholder="New password"
              maxLength={AUTH_PASSWORD_MAX_LENGTH}
              onInput={preventWhitespaceInput}
              aria-invalid={Boolean(fieldError("newPassword"))}
              {...register("newPassword", {
                onChange: () => onPasswordInputChange("newPassword"),
              })}
            />
            <PasswordVisibilityButton
              visible={visiblePasswords.newPassword}
              onToggle={() => togglePasswordVisibility("newPassword")}
              inputId="settings-new-password"
              label="new password"
              disabled={passwordState.saving}
            />
          </div>
          {fieldError("newPassword") && (
            <p className="mt-1 text-xs text-red-600">
              {fieldError("newPassword")}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>Confirm Password</label>
          <div className="relative">
            <input
              id="settings-confirm-password"
              type={visiblePasswords.confirmPassword ? "text" : "password"}
              className={`${INPUT_CLASS_NAME} pr-12`}
              placeholder="Confirm password"
              maxLength={AUTH_PASSWORD_MAX_LENGTH}
              onInput={preventWhitespaceInput}
              aria-invalid={Boolean(fieldError("confirmPassword"))}
              {...register("confirmPassword", {
                onChange: () => onPasswordInputChange("confirmPassword"),
              })}
            />
            <PasswordVisibilityButton
              visible={visiblePasswords.confirmPassword}
              onToggle={() => togglePasswordVisibility("confirmPassword")}
              inputId="settings-confirm-password"
              label="password confirmation"
              disabled={passwordState.saving}
            />
          </div>
          {fieldError("confirmPassword") && (
            <p className="mt-1 text-xs text-red-600">
              {fieldError("confirmPassword")}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Password Rules
        </p>
        <ul className="mt-2 space-y-1 text-xs">
          <li
            className={
              passwordPolicyChecks.minimumLength
                ? "text-teal-700"
                : "text-slate-400"
            }
          >
            At least 8 characters
          </li>
          <li
            className={
              passwordPolicyChecks.startsWithUppercase
                ? "text-teal-700"
                : "text-slate-400"
            }
          >
            Starts with a capital letter
          </li>
          <li
            className={
              passwordPolicyChecks.hasSpecialCharacter
                ? "text-teal-700"
                : "text-slate-400"
            }
          >
            Includes at least one special character
          </li>
          <li
            className={
              passwordPolicyChecks.hasLowercase
                ? "text-teal-700"
                : "text-slate-400"
            }
          >
            Includes at least one lowercase letter
          </li>
          <li
            className={
              passwordPolicyChecks.hasNumber
                ? "text-teal-700"
                : "text-slate-400"
            }
          >
            Includes at least one number
          </li>
          <li
            className={
              passwordPolicyChecks.differsFromCurrent
                ? "text-teal-700"
                : "text-slate-400"
            }
          >
            Different from current password
          </li>
          <li
            className={
              passwordPolicyChecks.matchesConfirmation
                ? "text-teal-700"
                : "text-slate-400"
            }
          >
            Matches confirmation
          </li>
        </ul>
      </div>

      {passwordOtpState.sent && (
        <div>
          <label className={LABEL_CLASS_NAME}>One-Time Password (OTP)</label>
          <input
            type="text"
            className={INPUT_CLASS_NAME}
            placeholder="Enter 6-digit code from email"
            inputMode="numeric"
            maxLength={AUTH_OTP_LENGTH}
            aria-invalid={Boolean(fieldError("otp"))}
            {...register("otp", {
              onChange: (event) => {
                const nextValue = sanitizeOtp(String(event.target.value || ""));
                setValue("otp", nextValue, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                onPasswordInputChange("otp");
              },
            })}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enter the OTP sent to your admin email to confirm password change.
          </p>
          {fieldError("otp") && (
            <p className="mt-1 text-xs text-red-600">
              {fieldError("otp")}
            </p>
          )}
        </div>
      )}

      {!passwordOtpState.sent && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Send OTP first, then verify it to complete password change.
        </p>
      )}

      {passwordOtpState.error && (
        <p className="text-sm text-red-600">{passwordOtpState.error}</p>
      )}
      {passwordOtpState.info && (
        <p className="text-sm text-teal-600">{passwordOtpState.info}</p>
      )}
      {passwordState.error && (
        <p className="text-sm text-red-600">{passwordState.error}</p>
      )}
      {passwordState.success && (
        <p className="text-sm text-teal-600">{passwordState.success}</p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onRequestOtp(watch())}
          disabled={
            passwordOtpState.requesting ||
            passwordState.saving ||
            !canRequestPasswordOtpValue
          }
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-5 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-500/30 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-500/10"
        >
          <KeyRound size={16} />
          {passwordOtpState.requesting
            ? "Sending OTP..."
            : passwordOtpState.sent
              ? "Resend OTP"
              : "Send OTP"}
        </button>
        <button
          type="submit"
          disabled={passwordState.saving || !canSubmitPasswordChangeValue}
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <KeyRound size={16} />
          {passwordState.saving ? "Updating..." : "Verify OTP & Change Password"}
        </button>
      </div>
    </form>
  );
};

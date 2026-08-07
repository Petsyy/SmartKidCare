import { KeyRound } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { PasswordForm } from "@/features/settings/hooks/useAdminPassword2FA";

const LABEL_CLASS_NAME =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const INPUT_CLASS_NAME =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:read-only:bg-slate-800 dark:read-only:text-slate-500";

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
  const { register, handleSubmit, setValue, watch } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <label className={LABEL_CLASS_NAME}>Current Password</label>
          <input
            type="password"
            className={INPUT_CLASS_NAME}
            placeholder="Current password"
            {...register("currentPassword", {
              onChange: () => onPasswordInputChange("currentPassword"),
            })}
          />
          {passwordFieldErrors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">
              {passwordFieldErrors.currentPassword}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>New Password</label>
          <input
            type="password"
            className={INPUT_CLASS_NAME}
            placeholder="New password"
            {...register("newPassword", {
              onChange: () => onPasswordInputChange("newPassword"),
            })}
          />
          {passwordFieldErrors.newPassword && (
            <p className="mt-1 text-xs text-red-600">
              {passwordFieldErrors.newPassword}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>Confirm Password</label>
          <input
            type="password"
            className={INPUT_CLASS_NAME}
            placeholder="Confirm password"
            {...register("confirmPassword", {
              onChange: () => onPasswordInputChange("confirmPassword"),
            })}
          />
          {passwordFieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {passwordFieldErrors.confirmPassword}
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
            maxLength={6}
            {...register("otp", {
              onChange: (event) => {
                const nextValue = String(event.target.value || "").replace(
                  /\D/g,
                  "",
                );
                setValue("otp", nextValue, {
                  shouldDirty: true,
                });
                onPasswordInputChange("otp");
              },
            })}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enter the OTP sent to your admin email to confirm password change.
          </p>
          {passwordFieldErrors.otp && (
            <p className="mt-1 text-xs text-red-600">
              {passwordFieldErrors.otp}
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

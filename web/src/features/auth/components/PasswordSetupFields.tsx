import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { PasswordVisibilityButton } from "@/components/ui/PasswordVisibilityButton";
import {
  AUTH_PASSWORD_MAX_LENGTH,
  type AdminLoginFormValues,
} from "../validations/auth.validation";
import { AUTH_INPUT_CLASS } from "../constants";

export interface PasswordSetupFieldsProps {
  register: UseFormRegister<AdminLoginFormValues>;
  formErrors: FieldErrors<AdminLoginFormValues>;
  isLoading: boolean;
  isResendingOtp: boolean;
  visiblePasswords: {
    newPassword: boolean;
    confirmPassword: boolean;
  };
  onToggleVisibility: (field: "newPassword" | "confirmPassword") => void;
  onInputFilter: (event: React.FormEvent<HTMLInputElement>) => void;
  otp: string;
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onOtpDigitChange: (index: number, value: string) => void;
  onOtpKeyDown: (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => void;
  onOtpPaste: (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => void;
  onResendOtp: () => Promise<void>;
}

export function PasswordSetupFields({
  register,
  formErrors,
  isLoading,
  isResendingOtp,
  visiblePasswords,
  onToggleVisibility,
  onInputFilter,
  otp,
  otpInputRefs,
  onOtpDigitChange,
  onOtpKeyDown,
  onOtpPaste,
  onResendOtp,
}: PasswordSetupFieldsProps) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          New Password
        </label>
        <div className="relative">
          <input
            id="captain-new-password"
            type={visiblePasswords.newPassword ? "text" : "password"}
            placeholder="Create a new password"
            className={`${AUTH_INPUT_CLASS} pr-12`}
            disabled={isLoading}
            autoComplete="new-password"
            maxLength={AUTH_PASSWORD_MAX_LENGTH}
            onInput={onInputFilter}
            aria-invalid={Boolean(formErrors.newPassword)}
            {...register("newPassword")}
          />
          <PasswordVisibilityButton
            visible={visiblePasswords.newPassword}
            onToggle={() => onToggleVisibility("newPassword")}
            inputId="captain-new-password"
            label="new password"
            disabled={isLoading}
          />
        </div>
        {formErrors.newPassword?.message && (
          <p className="mt-1 text-xs text-red-600">
            {formErrors.newPassword.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="captain-confirm-password"
            type={visiblePasswords.confirmPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            className={`${AUTH_INPUT_CLASS} pr-12`}
            disabled={isLoading}
            autoComplete="new-password"
            maxLength={AUTH_PASSWORD_MAX_LENGTH}
            onInput={onInputFilter}
            aria-invalid={Boolean(formErrors.confirmPassword)}
            {...register("confirmPassword")}
          />
          <PasswordVisibilityButton
            visible={visiblePasswords.confirmPassword}
            onToggle={() => onToggleVisibility("confirmPassword")}
            inputId="captain-confirm-password"
            label="password confirmation"
            disabled={isLoading}
          />
        </div>
        {formErrors.confirmPassword?.message && (
          <p className="mt-1 text-xs text-red-600">
            {formErrors.confirmPassword.message}
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Verification Code
          </label>
          <button
            type="button"
            onClick={() => void onResendOtp()}
            disabled={isLoading || isResendingOtp}
            className="cursor-pointer text-sm font-medium text-teal-700 transition hover:text-teal-800 disabled:cursor-not-allowed disabled:text-teal-400 dark:text-teal-300 dark:hover:text-teal-200 dark:disabled:text-teal-700"
          >
            {isResendingOtp ? "Sending..." : "Resend OTP"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              ref={(element) => {
                otpInputRefs.current[index] = element;
              }}
              type="text"
              value={otp[index] ?? ""}
              onChange={(event) => onOtpDigitChange(index, event.target.value)}
              onKeyDown={(event) => onOtpKeyDown(index, event)}
              onPaste={(event) => onOtpPaste(index, event)}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-12 shrink-0 rounded-xl border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900"
              disabled={isLoading}
              aria-label={`OTP digit ${index + 1}`}
              aria-invalid={Boolean(formErrors.otp)}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Check your inbox and enter the one-time code to continue.
        </p>
        {formErrors.otp?.message && (
          <p className="mt-1 text-xs text-red-600">{formErrors.otp.message}</p>
        )}
      </div>
    </>
  );
}

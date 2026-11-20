import { Lock, UserIcon } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { PasswordVisibilityButton } from "@/components/ui/PasswordVisibilityButton";
import {
  AUTH_LOGIN_IDENTIFIER_MAX_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  type AdminLoginFormValues,
} from "../validations";
import { AUTH_INPUT_CLASS } from "../constants";

export interface AdminCredentialFieldsProps {
  register: UseFormRegister<AdminLoginFormValues>;
  formErrors: FieldErrors<AdminLoginFormValues>;
  isLoading: boolean;
  passwordVisible: boolean;
  onTogglePasswordVisibility: () => void;
  onInputFilter: (event: React.FormEvent<HTMLInputElement>) => void;
}

export function AdminCredentialFields({
  register,
  formErrors,
  isLoading,
  passwordVisible,
  onTogglePasswordVisibility,
  onInputFilter,
}: AdminCredentialFieldsProps) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Username or Email
        </label>
        <div className="relative">
          <UserIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="Enter your username or email"
            className={`${AUTH_INPUT_CLASS} pl-11`}
            disabled={isLoading}
            autoComplete="username"
            maxLength={AUTH_LOGIN_IDENTIFIER_MAX_LENGTH}
            onInput={onInputFilter}
            aria-invalid={Boolean(formErrors.username)}
            {...register("username")}
          />
        </div>
        {formErrors.username?.message && (
          <p className="mt-1 text-xs text-red-600">
            {formErrors.username.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Password
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            id="admin-login-password"
            type={passwordVisible ? "text" : "password"}
            placeholder="Enter your password"
            className={`${AUTH_INPUT_CLASS} pl-11 pr-12`}
            disabled={isLoading}
            autoComplete="current-password"
            maxLength={AUTH_PASSWORD_MAX_LENGTH}
            onInput={onInputFilter}
            aria-invalid={Boolean(formErrors.password)}
            {...register("password")}
          />
          <PasswordVisibilityButton
            visible={passwordVisible}
            onToggle={onTogglePasswordVisibility}
            inputId="admin-login-password"
            label="password"
            disabled={isLoading}
          />
        </div>
        {formErrors.password?.message && (
          <p className="mt-1 text-xs text-red-600">
            {formErrors.password.message}
          </p>
        )}
      </div>
    </>
  );
}

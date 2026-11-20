import { useState } from "react";
import {
  AdminCredentialFields,
  LoginAlerts,
  LoginHeroBanner,
  LoginSubmitButton,
  PasswordSetupFields,
  sanitizeNoWhitespace,
  useAdminLogin,
} from "@/features/auth";
import { useSystemSettings } from "@/context/system-settings.context";



export default function AdminLogin() {
  const { settings } = useSystemSettings();
  const [visiblePasswords, setVisiblePasswords] = useState({
    login: false,
    newPassword: false,
    confirmPassword: false,
  });

  const {
    passwordSetupToken,
    info,
    error,
    isLoading,
    isResendingOtp,
    formErrors,
    otp,
    otpInputRefs,
    register,
    handleSubmit,
    onSubmit,
    handleOtpDigitChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleResendOtp,
  } = useAdminLogin();

  const isPasswordSetup = Boolean(passwordSetupToken);

  const preventWhitespaceInput = (event: React.FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = sanitizeNoWhitespace(event.currentTarget.value);
  };

  const togglePasswordVisibility = (field: keyof typeof visiblePasswords) => {
    setVisiblePasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-linear-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-teal-200/70 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-emerald-200/60 blur-3xl dark:bg-teal-400/10" />
        <div className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl dark:bg-sky-500/10" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-230 items-center p-4 py-8 md:px-6">
        <div className="grid w-full overflow-hidden rounded-3xl border border-teal-100 bg-white/90 shadow-[0_24px_60px_-24px_rgba(13,148,136,0.35)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_24px_60px_-24px_rgba(14,116,144,0.35)] lg:grid-cols-2">
          <LoginHeroBanner />

          <section className="flex flex-col">
            <div className="border-b border-slate-200 px-5 py-6 dark:border-slate-800 sm:px-8 md:px-10 md:py-7">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {settings?.schoolName || "Smart KidCare"}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Admin Portal
                </p>
              </div>
            </div>

            <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8 md:px-10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isPasswordSetup ? "Create Your Password" : "Sign In"}
                </h2>
                {!isPasswordSetup && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    to continue to your admin dashboard.
                  </p>
                )}
              </div>

              <LoginAlerts error={error} info={info} />

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                {!isPasswordSetup ? (
                  <AdminCredentialFields
                    register={register}
                    formErrors={formErrors}
                    isLoading={isLoading}
                    passwordVisible={visiblePasswords.login}
                    onTogglePasswordVisibility={() =>
                      togglePasswordVisibility("login")
                    }
                    onInputFilter={preventWhitespaceInput}
                  />
                ) : (
                  <PasswordSetupFields
                    register={register}
                    formErrors={formErrors}
                    isLoading={isLoading}
                    isResendingOtp={isResendingOtp}
                    visiblePasswords={{
                      newPassword: visiblePasswords.newPassword,
                      confirmPassword: visiblePasswords.confirmPassword,
                    }}
                    onToggleVisibility={togglePasswordVisibility}
                    onInputFilter={preventWhitespaceInput}
                    otp={otp}
                    otpInputRefs={otpInputRefs}
                    onOtpDigitChange={handleOtpDigitChange}
                    onOtpKeyDown={handleOtpKeyDown}
                    onOtpPaste={handleOtpPaste}
                    onResendOtp={handleResendOtp}
                  />
                )}

                <LoginSubmitButton
                  isLoading={isLoading}
                  isPasswordSetup={isPasswordSetup}
                />
              </form>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-8 md:px-10">
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                &copy; 2026 {settings?.schoolName || "Smart KidCare"}. All
                rights reserved.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

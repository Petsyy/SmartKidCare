import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserIcon, Lock, AlertCircle } from "lucide-react";
import { API_BASE } from "@/components/config/config.api";

type ApiResponse = {
  status: number;
  data: any;
};

const parseApiResponse = async (response: Response): Promise<ApiResponse> => {
  const raw = await response.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  return {
    status: response.status,
    data,
  };
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaEmail, setMfaEmail] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100";

  const getOtpDigits = () =>
    Array.from({ length: 6 }, (_, index) => otp[index] ?? "");

  const updateOtpWithDigits = (nextDigits: string[]) => {
    setOtp(nextDigits.join("").replace(/\D/g, "").slice(0, 6));
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, "");
    const nextDigits = getOtpDigits();

    if (!cleaned) {
      nextDigits[index] = "";
      updateOtpWithDigits(nextDigits);
      return;
    }

    if (cleaned.length === 1) {
      nextDigits[index] = cleaned;
      updateOtpWithDigits(nextDigits);
      if (index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
      return;
    }

    let cursor = index;
    for (const digit of cleaned.slice(0, 6 - index)) {
      nextDigits[cursor] = digit;
      cursor += 1;
    }
    updateOtpWithDigits(nextDigits);
    otpInputRefs.current[Math.min(cursor, 5)]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      const nextDigits = getOtpDigits();
      if (nextDigits[index]) {
        event.preventDefault();
        nextDigits[index] = "";
        updateOtpWithDigits(nextDigits);
        return;
      }
      if (index > 0) {
        event.preventDefault();
        nextDigits[index - 1] = "";
        updateOtpWithDigits(nextDigits);
        otpInputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) {
      return;
    }

    event.preventDefault();
    const nextDigits = getOtpDigits();
    let cursor = index;

    for (const digit of pasted.slice(0, 6 - index)) {
      nextDigits[cursor] = digit;
      cursor += 1;
    }

    updateOtpWithDigits(nextDigits);
    otpInputRefs.current[Math.min(cursor, 5)]?.focus();
  };

  const handleResendOtp = async () => {
    if (!mfaToken || isResendingOtp) {
      return;
    }

    setIsResendingOtp(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`${API_BASE}/auth/admin/mfa/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ mfaToken }),
      });

      const { status, data } = await parseApiResponse(response);
      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          `Failed to resend OTP (HTTP ${status})`;
        throw new Error(message);
      }

      if (data?.mfaToken) {
        setMfaToken(data.mfaToken);
      }
      if (data?.email) {
        setMfaEmail(data.email);
      }

      setInfo(data?.message || "A new OTP has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (!mfaToken) {
        if (!username || !password) {
          throw new Error("Please fill in all fields");
        }

        const response = await fetch(`${API_BASE}/auth/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        });

        const { status, data } = await parseApiResponse(response);
        if (!response.ok) {
          const message =
            data?.message || data?.error || `Login failed (HTTP ${status})`;
          throw new Error(message);
        }

        if (data?.requiresMfa) {
          if (!data?.mfaToken) {
            throw new Error("MFA challenge is missing. Please try again.");
          }

          setMfaToken(data.mfaToken);
          setMfaEmail(data.email || null);
          setOtp("");
          setInfo(
            data?.message || "A verification code was sent to your email.",
          );
          return;
        }

        if (data?.user?.email) {
          localStorage.setItem("adminEmail", data.user.email);
        }

        navigate("/dashboard");
        return;
      }

      if (!otp) {
        throw new Error("Please enter the verification code.");
      }

      const response = await fetch(`${API_BASE}/auth/admin/mfa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ mfaToken, otp }),
      });

      const { status, data } = await parseApiResponse(response);
      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          `OTP verification failed (HTTP ${status})`;
        throw new Error(message);
      }

      if (data?.user?.email) {
        localStorage.setItem("adminEmail", data.user.email);
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-teal-200/70 blur-3xl" />
        <div className="absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-230 items-center p-4 py-8 md:px-6">
        <div className="grid w-full overflow-hidden rounded-3xl border border-teal-100 bg-white/90 shadow-[0_24px_60px_-24px_rgba(13,148,136,0.35)] backdrop-blur-sm lg:grid-cols-2">
          <aside className="relative hidden bg-linear-to-br from-teal-700 via-teal-600 to-emerald-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/30" />
            <div className="pointer-events-none absolute bottom-8 right-8 h-24 w-24 rounded-3xl bg-white/10" />
            <div className="relative">
              <h1 className="text-4xl font-black leading-tight">
                Secure access for daily school operations.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-teal-50">
                Monitor attendance, feeding records, and parent-linked child
                profiles from one admin workspace.
              </p>
            </div>
          </aside>

          <section className="flex flex-col">
            <div className="border-b border-slate-200 px-8 py-7 md:px-10">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Smart KidCare
                </h1>
                <p className="text-sm text-slate-500">Admin Portal</p>
              </div>
            </div>

            <div className="flex-1 px-8 py-8 md:px-10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {mfaToken ? "Verify Your Login" : "Admin Sign In"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {mfaToken
                    ? `Enter the OTP sent to ${mfaEmail || "your email"}`
                    : "Sign in to continue to your admin dashboard."}
                </p>
              </div>

              {error && (
                <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="shrink-0 text-red-600" size={20} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {info && (
                <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <p className="text-sm text-teal-700">{info}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!mfaToken && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Username
                      </label>
                      <div className="relative">
                        <UserIcon
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your username"
                          className={`${inputClassName} pl-11`}
                          disabled={isLoading}
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Password
                      </label>
                      <div className="relative">
                        <Lock
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className={`${inputClassName} pl-11`}
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                  </>
                )}

                {mfaToken && (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading || isResendingOtp}
                        className="cursor-pointer text-sm font-medium text-teal-700 transition hover:text-teal-800 disabled:cursor-not-allowed disabled:text-teal-400"
                      >
                        {isResendingOtp ? "Sending..." : "Resend OTP"}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            otpInputRefs.current[index] = element;
                          }}
                          type="text"
                          value={otp[index] ?? ""}
                          onChange={(event) =>
                            handleOtpDigitChange(index, event.target.value)
                          }
                          onKeyDown={(event) => handleOtpKeyDown(index, event)}
                          onPaste={(event) => handleOtpPaste(index, event)}
                          inputMode="numeric"
                          maxLength={1}
                          className="h-12 w-12 rounded-xl border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                          disabled={isLoading}
                          aria-label={`OTP digit ${index + 1}`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Check your inbox and enter the one-time code to continue.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-teal-500 py-3 font-semibold text-white shadow-md transition hover:from-teal-700 hover:to-teal-600 disabled:cursor-not-allowed disabled:from-teal-400 disabled:to-teal-400"
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {mfaToken ? "Verifying..." : "Signing in..."}
                    </>
                  ) : mfaToken ? (
                    "Verify & Sign In"
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-8 py-5 md:px-10">
              <p className="text-center text-xs text-slate-500">
                Copyright 2026 Smart KidCare. All rights reserved.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

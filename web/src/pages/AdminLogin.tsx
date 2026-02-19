import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, UserIcon, Lock, AlertCircle } from "lucide-react";
import { API_BASE } from "../components/config/config.api";

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

  const handleBackToCredentials = () => {
    setMfaToken(null);
    setMfaEmail(null);
    setOtp("");
    setInfo(null);
    setError(null);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md my-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-h-[95vh] overflow-y-auto">
          <div className="px-8 py-6 text-center border-b border-gray-100">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-md">
                <Shield className="text-white" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Smart KidCare</h1>
            <p className="text-gray-500 text-sm mt-1">Admin Portal</p>
          </div>

          <div className="px-8 py-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {mfaToken ? "Verify Login" : "Admin Portal"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mfaToken
                  ? `Enter the OTP sent to ${mfaEmail || "your email"}`
                  : "Smart KidCare Management Access"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="text-red-600 shrink-0" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {info && (
              <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm text-teal-700">{info}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!mfaToken && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <UserIcon
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </>
              )}

              {mfaToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Enter 6-digit OTP"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm tracking-[0.3em]"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {mfaToken ? "Verifying..." : "Signing in..."}
                  </>
                ) : mfaToken ? (
                  "Verify & Sign In"
                ) : (
                  "Sign In"
                )}
              </button>

              {mfaToken && (
                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || isResendingOtp}
                    className="text-sm text-teal-700 hover:text-teal-800 disabled:text-teal-400 font-medium"
                  >
                    {isResendingOtp ? "Sending..." : "Resend OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    disabled={isLoading || isResendingOtp}
                    className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 font-medium"
                  >
                    Use another account
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Copyright 2026 Smart KidCare. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

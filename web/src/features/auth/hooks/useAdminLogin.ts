import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_BASE } from "@/api/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminLoginStore } from "@/stores/admin-login.store";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { webQueryKeys } from "@/lib/query-keys";
import {
  adminLoginFormSchema,
  sanitizeOtp,
  type AdminLoginFormValues,
} from "@/features/auth/validations/auth.validation";

type ApiResponse = {
  status: number;
  data: AuthApiData | null;
};

type AuthApiData = {
  message?: string;
  error?: string;
  requiresPasswordChange?: boolean;
  requiresMfa?: boolean;
  passwordSetupToken?: string;
  mfaToken?: string;
  email?: string;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const parseApiResponse = async (response: Response): Promise<ApiResponse> => {
  const raw = await response.text();
  let data: AuthApiData | null = null;

  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    data =
      parsed && typeof parsed === "object" ? (parsed as AuthApiData) : null;
  } catch {
    data = null;
  }

  return {
    status: response.status,
    data,
  };
};

export function useAdminLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, isChecking } = useAuthSession();

  const {
    mfaToken,
    mfaEmail,
    passwordSetupToken,
    passwordSetupEmail,
    info,
    error,
    setMfaToken,
    setMfaEmail,
    setPasswordSetupToken,
    setPasswordSetupEmail,
    setInfo,
    setError,
    resetMessages,
    resetLoginFlow,
  } = useAdminLoginStore();

  useEffect(() => {
    if (!isChecking && isAuthenticated && user?.role === "barangay_captain") {
      if (user.mustChangePassword) {
        void fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          credentials: "include",
        }).finally(() => {
          void queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
          setInfo("Sign in again to create your private password.");
        });
        return;
      }
      navigate("/monitoring/dashboard", { replace: true });
    }
  }, [isAuthenticated, isChecking, user, navigate, queryClient, setInfo]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors: formErrors },
  } =
    useForm<AdminLoginFormValues>({
      resolver: zodResolver(adminLoginFormSchema),
      defaultValues: {
        flowMode: passwordSetupToken
          ? "passwordSetup"
          : mfaToken
            ? "mfa"
            : "credentials",
        username: "",
        password: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      },
    });

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = watch("otp");

  const loginMutation = useMutation({
    mutationFn: async (variables: { username: string; password: string }) => {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(variables),
      });
      const { status, data } = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || `Login failed (HTTP ${status})`,
        );
      }
      return data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (variables: { mfaToken: string; otp: string }) => {
      const response = await fetch(`${API_BASE}/auth/admin/mfa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(variables),
      });
      const { status, data } = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `OTP verification failed (HTTP ${status})`,
        );
      }
      return data;
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (variables: { mfaToken: string }) => {
      const response = await fetch(`${API_BASE}/auth/admin/mfa/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(variables),
      });
      const { status, data } = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Failed to resend OTP (HTTP ${status})`,
        );
      }
      return data;
    },
  });

  const passwordSetupMutation = useMutation({
    mutationFn: async (variables: {
      passwordSetupToken: string;
      newPassword: string;
      confirmPassword: string;
      otp: string;
    }) => {
      const response = await fetch(`${API_BASE}/auth/captain/password/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(variables),
      });
      const { status, data } = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || `Password setup failed (HTTP ${status})`);
      }
      return data;
    },
  });

  const passwordSetupResendMutation = useMutation({
    mutationFn: async (variables: { passwordSetupToken: string }) => {
      const response = await fetch(`${API_BASE}/auth/captain/password/setup/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      });
      const { status, data } = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || `Failed to resend OTP (HTTP ${status})`);
      }
      return data;
    },
  });

  const isLoading = loginMutation.isPending || verifyMutation.isPending || passwordSetupMutation.isPending;
  const isResendingOtp = resendMutation.isPending || passwordSetupResendMutation.isPending;

  const getOtpDigits = () =>
    Array.from({ length: 6 }, (_, index) => otp[index] ?? "");

  const updateOtpWithDigits = (nextDigits: string[]) => {
    setValue("otp", sanitizeOtp(nextDigits.join("")), {
      shouldDirty: true,
      shouldValidate: true,
    });
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
    if ((!mfaToken && !passwordSetupToken) || isResendingOtp) {
      return;
    }

    resetMessages();

    try {
      if (passwordSetupToken) {
        const data = await passwordSetupResendMutation.mutateAsync({ passwordSetupToken });
        setInfo(data?.message || "A new OTP has been sent.");
        return;
      }

      const data = await resendMutation.mutateAsync({ mfaToken: mfaToken! });

      if (data?.mfaToken) {
        setMfaToken(data.mfaToken);
      }
      if (data?.email) {
        setMfaEmail(data.email);
      }

      setInfo(data?.message || "A new OTP has been sent.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to resend OTP."));
    }
  };

  const onSubmit = async (values: AdminLoginFormValues) => {
    resetMessages();

    try {
      if (passwordSetupToken) {
        await passwordSetupMutation.mutateAsync({
          passwordSetupToken,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
          otp: values.otp,
        });
        resetLoginFlow();
        setValue("password", "");
        setValue("newPassword", "");
        setValue("confirmPassword", "");
        setValue("otp", "");
        await queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
        navigate("/monitoring/dashboard", { replace: true });
        return;
      }

      if (!mfaToken) {
        const username = values.username;
        const password = values.password;
        if (!username || !password) {
          throw new Error("Please fill in all fields");
        }

        const data = await loginMutation.mutateAsync({ username, password });

        if (data?.requiresPasswordChange) {
          if (!data?.passwordSetupToken) {
            throw new Error("Password setup could not be started. Please try again.");
          }
          setPasswordSetupToken(data.passwordSetupToken);
          setPasswordSetupEmail(data.email || null);
          setValue("flowMode", "passwordSetup");
          clearErrors();
          setValue("password", "");
          setValue("otp", "");
          setInfo(data?.message || "Create a new password to continue.");
          return;
        }

        if (data?.requiresMfa) {
          if (!data?.mfaToken) {
            throw new Error("MFA challenge is missing. Please try again.");
          }

          setMfaToken(data.mfaToken);
          setMfaEmail(data.email || null);
          setValue("flowMode", "mfa");
          clearErrors();
          setValue("otp", "");
          setInfo(
            data?.message || "A verification code was sent to your email.",
          );
          return;
        }

        await queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
        navigate("/monitoring/dashboard");
        return;
      }

      const otp = values.otp;

      await verifyMutation.mutateAsync({ mfaToken, otp });

      await queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
      setMfaToken(null);
      setMfaEmail(null);
      setValue("otp", "");
      navigate("/monitoring/dashboard");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Login failed. Please try again.");
      if (passwordSetupToken && /invalid or expired password setup/i.test(message)) {
        setPasswordSetupToken(null);
        setPasswordSetupEmail(null);
        setValue("flowMode", "credentials");
        clearErrors();
        setValue("newPassword", "");
        setValue("confirmPassword", "");
        setValue("otp", "");
      }
      setError(message);
    }
  };

  return {
    mfaToken,
    mfaEmail,
    passwordSetupToken,
    passwordSetupEmail,
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
  };
}

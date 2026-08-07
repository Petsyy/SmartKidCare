import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { API_BASE } from "@/api/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminLoginStore } from "@/stores/admin-login.store";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { webQueryKeys } from "@/lib/query-keys";

type ApiResponse = {
  status: number;
  data: any;
};

export type AdminLoginFormValues = {
  username: string;
  password: string;
  otp: string;
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

export function useAdminLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, isChecking } = useAuthSession();

  useEffect(() => {
    if (!isChecking && isAuthenticated && user?.role === "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isChecking, user, navigate]);

  const {
    mfaToken,
    mfaEmail,
    info,
    error,
    setMfaToken,
    setMfaEmail,
    setInfo,
    setError,
    resetMessages,
  } = useAdminLoginStore();

  const { register, handleSubmit, watch, setValue } =
    useForm<AdminLoginFormValues>({
      defaultValues: {
        username: "",
        password: "",
        otp: "",
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

  const isLoading = loginMutation.isPending || verifyMutation.isPending;
  const isResendingOtp = resendMutation.isPending;

  const getOtpDigits = () =>
    Array.from({ length: 6 }, (_, index) => otp[index] ?? "");

  const updateOtpWithDigits = (nextDigits: string[]) => {
    setValue("otp", nextDigits.join("").replace(/\D/g, "").slice(0, 6), {
      shouldDirty: true,
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
    if (!mfaToken || isResendingOtp) {
      return;
    }

    resetMessages();

    try {
      const data = await resendMutation.mutateAsync({ mfaToken });

      if (data?.mfaToken) {
        setMfaToken(data.mfaToken);
      }
      if (data?.email) {
        setMfaEmail(data.email);
      }

      setInfo(data?.message || "A new OTP has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    }
  };

  const onSubmit = async (values: AdminLoginFormValues) => {
    resetMessages();

    try {
      if (!mfaToken) {
        const username = values.username.trim();
        const password = values.password;
        if (!username || !password) {
          throw new Error("Please fill in all fields");
        }

        const data = await loginMutation.mutateAsync({ username, password });

        if (data?.requiresMfa) {
          if (!data?.mfaToken) {
            throw new Error("MFA challenge is missing. Please try again.");
          }

          setMfaToken(data.mfaToken);
          setMfaEmail(data.email || null);
          setValue("otp", "");
          setInfo(
            data?.message || "A verification code was sent to your email.",
          );
          return;
        }

        await queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
        navigate("/dashboard");
        return;
      }

      const otp = values.otp.trim();
      if (!otp) {
        throw new Error("Please enter the verification code.");
      }

      await verifyMutation.mutateAsync({ mfaToken, otp });

      await queryClient.invalidateQueries({ queryKey: webQueryKeys.authSession() });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return {
    mfaToken,
    mfaEmail,
    info,
    error,
    isLoading,
    isResendingOtp,
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

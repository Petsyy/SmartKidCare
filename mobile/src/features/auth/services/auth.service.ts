import { apiClient } from "@/src/api/client";
import type {
  LoginCredentials,
  AuthenticatedLoginResponse,
  LoginResponse,
} from "../types";

export class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const data = await apiClient<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: credentials,
      authenticated: false,
    });

    if ("requiresPasswordChange" in data && data.requiresPasswordChange) {
      return data;
    }

    const role = (data as AuthenticatedLoginResponse).user?.role;
    if (role !== "teacher" && role !== "parent") {
      throw new Error("This account must use the web portal");
    }

    return data;
  }

  async verifyTeacherPasswordOtp(
    email: string,
    otp: string,
  ): Promise<{ passwordSetupToken: string; message?: string }> {
    return apiClient("/api/auth/password-otp/verify", {
      method: "POST",
      body: { email, otp },
      authenticated: false,
    });
  }

  async resendTeacherPasswordOtp(
    email: string,
  ): Promise<{ message?: string }> {
    return apiClient("/api/auth/password-otp/resend", {
      method: "POST",
      body: { email },
      authenticated: false,
    });
  }

  async completeTeacherPasswordSetup(
    passwordSetupToken: string,
    newPassword: string,
  ): Promise<AuthenticatedLoginResponse> {
    return apiClient("/api/auth/password/setup", {
      method: "POST",
      body: { passwordSetupToken, newPassword },
      authenticated: false,
    });
  }

  async requestForgotPasswordOtp(
    email: string,
  ): Promise<{ message?: string }> {
    return apiClient("/api/auth/forgot-password/request", {
      method: "POST",
      body: { email },
      authenticated: false,
    });
  }

  async verifyForgotPasswordOtp(
    email: string,
    otp: string,
  ): Promise<{ passwordResetToken: string; message?: string }> {
    return apiClient("/api/auth/forgot-password/verify", {
      method: "POST",
      body: { email, otp },
      authenticated: false,
    });
  }

  async resetForgotPassword(
    passwordResetToken: string,
    newPassword: string,
  ): Promise<{ message?: string }> {
    return apiClient("/api/auth/forgot-password/reset", {
      method: "POST",
      body: { passwordResetToken, newPassword },
      authenticated: false,
    });
  }

  async getProfile(): Promise<any> {
    const data = await apiClient<{ user: any }>("/api/auth/me");

    if (!data?.user) {
      throw new Error("Invalid profile response from server");
    }

    return {
      id: String(data.user._id || data.user.id || ""),
      ...data.user,
    };
  }

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return apiClient("/api/auth/change-password", {
      method: "POST",
      body: payload,
    });
  }
}

export const authService = new AuthService();

// Backwards-compatible bound aliases
export const login = (credentials: LoginCredentials) => authService.login(credentials);
export const verifyTeacherPasswordOtp = (email: string, otp: string) =>
  authService.verifyTeacherPasswordOtp(email, otp);
export const resendTeacherPasswordOtp = (email: string) =>
  authService.resendTeacherPasswordOtp(email);
export const completeTeacherPasswordSetup = (
  passwordSetupToken: string,
  newPassword: string,
) => authService.completeTeacherPasswordSetup(passwordSetupToken, newPassword);
export const requestForgotPasswordOtp = (email: string) =>
  authService.requestForgotPasswordOtp(email);
export const verifyForgotPasswordOtp = (email: string, otp: string) =>
  authService.verifyForgotPasswordOtp(email, otp);
export const resetForgotPassword = (
  passwordResetToken: string,
  newPassword: string,
) => authService.resetForgotPassword(passwordResetToken, newPassword);
export const getProfile = () => authService.getProfile();
export const changePassword = (payload: {
  currentPassword: string;
  newPassword: string;
}) => authService.changePassword(payload);

import { apiClient } from "./client";

export type {
  LoginCredentials,
  LoggedInUser,
  AuthenticatedLoginResponse,
  PasswordChangeChallengeResponse,
  LoginResponse,
} from "./api.types";

import type {
  LoginCredentials,
  LoginResponse,
  AuthenticatedLoginResponse,
} from "./api.types";

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const data = await apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: credentials,
    authenticated: false,
  });

  if ("requiresPasswordChange" in data && data.requiresPasswordChange) {
    return data;
  }

  if ((data as any).user?.role === "admin") {
    throw new Error("Admin accounts cannot log in on the mobile app");
  }

  return data;
};

export const verifyTeacherPasswordOtp = async (
  email: string,
  otp: string,
): Promise<{ passwordSetupToken: string; message?: string }> => {
  return apiClient("/api/auth/password-otp/verify", {
    method: "POST",
    body: { email, otp },
    authenticated: false,
  });
};

export const resendTeacherPasswordOtp = async (
  email: string,
): Promise<{ message?: string }> => {
  return apiClient("/api/auth/password-otp/resend", {
    method: "POST",
    body: { email },
    authenticated: false,
  });
};

export const completeTeacherPasswordSetup = async (
  passwordSetupToken: string,
  newPassword: string,
): Promise<AuthenticatedLoginResponse> => {
  return apiClient("/api/auth/password/setup", {
    method: "POST",
    body: { passwordSetupToken, newPassword },
    authenticated: false,
  });
};

export const requestForgotPasswordOtp = async (
  email: string,
): Promise<{ message?: string }> => {
  return apiClient("/api/auth/forgot-password/request", {
    method: "POST",
    body: { email },
    authenticated: false,
  });
};

export const verifyForgotPasswordOtp = async (
  email: string,
  otp: string,
): Promise<{ passwordResetToken: string; message?: string }> => {
  return apiClient("/api/auth/forgot-password/verify", {
    method: "POST",
    body: { email, otp },
    authenticated: false,
  });
};

export const resetForgotPassword = async (
  passwordResetToken: string,
  newPassword: string,
): Promise<{ message?: string }> => {
  return apiClient("/api/auth/forgot-password/reset", {
    method: "POST",
    body: { passwordResetToken, newPassword },
    authenticated: false,
  });
};

export const getProfile = async (): Promise<any> => {
  const data = await apiClient<{ user: any }>("/api/auth/me");

  if (!data?.user) {
    throw new Error("Invalid profile response from server");
  }

  return data.user;
};

export const changePassword = async (
  payload: { currentPassword: string; newPassword: string },
): Promise<{ message: string }> => {
  return apiClient("/api/auth/change-password", {
    method: "POST",
    body: payload,
  });
};

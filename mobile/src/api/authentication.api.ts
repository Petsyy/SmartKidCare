import { API_BASE_URL } from "../config/config.api";

export type {
  LoginCredentials,
  LoggedInUser,
  AuthenticatedLoginResponse,
  PasswordChangeChallengeResponse,
  LoginResponse,
} from "./api.types";

import type {
  LoginCredentials,
  LoggedInUser,
  AuthenticatedLoginResponse,
  PasswordChangeChallengeResponse,
  LoginResponse,
} from "./api.types";

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  if (data.requiresPasswordChange) {
    return data;
  }

  if (data.user.role === "admin") {
    throw new Error("Admin accounts cannot log in on the mobile app");
  }

  return data;
};

export const verifyTeacherPasswordOtp = async (
  email: string,
  otp: string
): Promise<{ passwordSetupToken: string; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/password-otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "OTP verification failed");
  }

  return data;
};

export const resendTeacherPasswordOtp = async (
  email: string
): Promise<{ message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/password-otp/resend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to resend OTP");
  }

  return data;
};

export const completeTeacherPasswordSetup = async (
  passwordSetupToken: string,
  newPassword: string
): Promise<AuthenticatedLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/password/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ passwordSetupToken, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to set new password");
  }

  return data;
};

export const requestForgotPasswordOtp = async (
  email: string
): Promise<{ message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to request forgot-password OTP");
  }

  return data;
};

export const verifyForgotPasswordOtp = async (
  email: string,
  otp: string
): Promise<{ passwordResetToken: string; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to verify forgot-password OTP");
  }

  return data;
};

export const resetForgotPassword = async (
  passwordResetToken: string,
  newPassword: string
): Promise<{ message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ passwordResetToken, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reset password");
  }

  return data;
};

export const getMe = async (token: string): Promise<LoggedInUser> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user");
  }

  return data.user;
};



export const changePassword = async (
  token: string,
  payload: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to change password");
  }

  return data;
};

export default API_BASE_URL;

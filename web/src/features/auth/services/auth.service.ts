import { apiRequest, apiRequestOrThrow, parseApiError } from "@/api/api-client";
import { API_BASE } from "@/api/config";
import type {
  AuthLoginResponse,
  AuthSessionState,
  AuthUser,
  CaptainPasswordSetupPayload,
  CaptainPasswordSetupResendPayload,
  LoginAdminPayload,
} from "../types";

export class AuthService {
  async loginAdmin(
    payload: LoginAdminPayload,
  ): Promise<AuthLoginResponse> {
    return apiRequestOrThrow<AuthLoginResponse>(
      "/auth/admin/login",
      "Login failed",
      {
        method: "POST",
        body: payload,
      },
    );
  }

  async setupCaptainPassword(
    payload: CaptainPasswordSetupPayload,
  ): Promise<AuthLoginResponse> {
    return apiRequestOrThrow<AuthLoginResponse>(
      "/auth/captain/password/setup",
      "Password setup failed",
      {
        method: "POST",
        body: payload,
      },
    );
  }

  async resendCaptainPasswordSetupOtp(
    payload: CaptainPasswordSetupResendPayload,
  ): Promise<AuthLoginResponse> {
    return apiRequestOrThrow<AuthLoginResponse>(
      "/auth/captain/password/setup/resend",
      "Failed to resend OTP",
      {
        method: "POST",
        body: payload,
      },
    );
  }

  async getAuthSession(): Promise<AuthSessionState> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });

    if (response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        user?: AuthUser;
      };
      return {
        isAuthenticated: true,
        user: payload.user ?? null,
      };
    }

    if (response.status === 401) {
      return { isAuthenticated: false, user: null };
    }

    throw new Error(await parseApiError(response, "Unable to verify session"));
  }

  async logoutAdmin(): Promise<void> {
    await apiRequest<void>("/auth/logout", {
      method: "POST",
    });
  }
}

export const authService = new AuthService();

export const loginAdmin = (payload: LoginAdminPayload) =>
  authService.loginAdmin(payload);
export const setupCaptainPassword = (payload: CaptainPasswordSetupPayload) =>
  authService.setupCaptainPassword(payload);
export const resendCaptainPasswordSetupOtp = (
  payload: CaptainPasswordSetupResendPayload,
) => authService.resendCaptainPasswordSetupOtp(payload);
export const getAuthSession = () => authService.getAuthSession();
export const logoutAdmin = () => authService.logoutAdmin();

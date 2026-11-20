export type AuthUser = {
  _id?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  mustChangePassword?: boolean;
};

export type AuthSessionState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
};

export type LoginAdminPayload = {
  username: string;
  password: string;
};

export type AuthLoginResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  requiresPasswordChange?: boolean;
  passwordSetupToken?: string;
  email?: string;
  user?: AuthUser;
};

export type CaptainPasswordSetupPayload = {
  passwordSetupToken: string;
  newPassword: string;
  confirmPassword: string;
  otp: string;
};

export type CaptainPasswordSetupResendPayload = {
  passwordSetupToken: string;
};

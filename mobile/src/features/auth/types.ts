export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface LoggedInUser {
  _id: string;
  email: string;
  role: "teacher" | "parent";
  firstName?: string;
  lastName?: string;
  mustChangePassword?: boolean;
  needsToConfirmLink?: boolean;
  daycareCenterId?: string | null;
  daycareCenter?: { _id: string; name: string } | string | null;
}

export interface AuthenticatedLoginResponse {
  requiresPasswordChange?: false;
  token: string;
  user: LoggedInUser;
}

export interface PasswordChangeChallengeResponse {
  requiresPasswordChange: true;
  email: string;
  requiresOtp?: boolean;
  passwordSetupToken?: string;
  message?: string;
}

export type LoginResponse =
  | AuthenticatedLoginResponse
  | PasswordChangeChallengeResponse;

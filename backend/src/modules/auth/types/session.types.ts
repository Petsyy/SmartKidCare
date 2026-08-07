export interface LoginCredentials {
  identifier: string;
  password: string;
  isAdminRoute: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface AdminPreferencesPayload {
  adminMfaEnabled?: boolean;
  adminNotifySecurityEvents?: boolean;
  adminNotifySystemUpdates?: boolean;
}

export interface LinkedChild {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId: string;
  source: string;
  status: string;
}

export interface UserWithChildren {
  [key: string]: any;
  linkedChildren?: LinkedChild[];
}

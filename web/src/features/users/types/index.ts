export interface User {
  _id: string;
  username?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  role: "barangay_captain" | "teacher" | "parent";
  daycareCenter?: {
    _id: string;
    name: string;
    barangay: string;
    code: string;
    isActive?: boolean;
  } | null;
  isActive?: boolean;
  mustChangePassword: boolean;
  latestTempPassword?: string;
  latestTempPasswordIssuedAt?: string;
  captainOnboardingStatus?: "invitation_pending" | "active" | "inactive";
  captainInvitationExpiresAt?: string;
  captainInvitationSentAt?: string;
  captainInvitationActivatedAt?: string;
  captainReplaces?: string;
  linkedChildren?: Array<{
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    studentId?: string;
    source?: "child" | "request";
    status?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersParams {
  role?: "teacher" | "parent";
}

export interface TeacherData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  daycareCenterId?: string;
  status?: "Active" | "Inactive";
}

export interface DaycareCenterSummary {
  _id: string;
  name: string;
  barangay: string;
  code: string;
  isActive?: boolean;
}

export interface Teacher {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  daycareCenterId?: string;
  role: "teacher";
  daycareCenter?: DaycareCenterSummary | null;
  status?: "Active" | "Inactive";
  verificationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherResponse {
  teacher: Teacher;
  credentials: {
    email: string;
    tempPassword: string;
  };
  emailDelivery?: {
    sent: boolean;
    to: string;
    message?: string;
  };
}

export interface ListTeachersParams {
  status?: "pending" | "approved" | "rejected";
  page?: number;
  limit?: number;
}

export interface ParentLinkedChildItem {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId?: string;
  source: "child";
  status: "linked";
}

export type AccountStatusFilter = "all" | "active" | "inactive";

export type UseAddTeacherFormProps = {
  onClose: () => void;
  onCreated: () => void;
};

export type UseEditUserFormProps = {
  user: User;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
};


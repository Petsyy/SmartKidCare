import { API_BASE_URL } from "../config/config.api";
import { Child, ChildDocumentIntegrity } from "./parent.api";

export interface ChildEnrollmentRequestPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: "male" | "female";
  programType: "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)";
  daycareCenterId: string;
  enrollmentDate: string;
  schoolYear: string;
  parentFirstName: string;
  parentMiddleName?: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
}

export interface ChildEnrollmentRequestFiles {
  birthCertificate?: {
    uri: string;
    name: string;
    mimeType?: string | null;
  } | null;
  parentId?: {
    uri: string;
    name: string;
    mimeType?: string | null;
  } | null;
}

export interface EnrollmentCenterOption {
  _id: string;
  name: string;
  barangay: string;
  code: string;
  isActive?: boolean;
}

export interface ChildEnrollmentSubmissionResponse {
  message: string;
  request: TeacherEnrollmentRequest;
  parentCredentials?: {
    email: string;
    phone: string;
    tempPassword: string | null;
  };
}

export interface TeacherEnrollmentRequest {
  _id: string;
  status: "pending" | "approved" | "rejected";
  child: {
    fullName: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    gender: "male" | "female";
    programType: "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)";
    enrollmentDate: string;
    schoolYear: string;
  };
  parent: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
  };
  review?: {
    reviewedAt?: string | null;
    reason?: string;
  };
  createdChild?: {
    _id: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    studentId?: string;
    documentIntegrity?: ChildDocumentIntegrity | null;
  } | null;
  /** When false, parent finished password setup / changed password; hide teacher reset action. */
  showResetParentPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParentResetPasswordResponse {
  message: string;
  credentials: {
    email: string;
    phone: string;
    tempPassword: string;
  };
}

export interface ParentCredentialsResponse {
  message: string;
  credentials: {
    email: string;
    phone: string;
    tempPassword: string | null;
  };
}

export const getChildren = async (token: string): Promise<Child[]> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/children`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch children");
  }

  return Array.isArray(data) ? data : [];
};
export const getTeacherProfile = async (token: string) => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await response.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || raw || "Failed to fetch teacher profile");
  }

  if (!data?.user) {
    throw new Error("Invalid profile response from server");
  }

  return data.user;
};

export const getEnrollmentCenters = async (
  token: string,
): Promise<EnrollmentCenterOption[]> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/children/enrollment-centers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch centers");
  }

  return Array.isArray(data.centers) ? data.centers : [];
};

export const submitChildEnrollmentRequest = async (
  token: string,
  payload: ChildEnrollmentRequestPayload,
  files?: ChildEnrollmentRequestFiles,
): Promise<ChildEnrollmentSubmissionResponse> => {
  if (!token) throw new Error("No authentication token");

  const formData = new FormData();

  (Object.entries(payload) as [keyof ChildEnrollmentRequestPayload, any][])
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length > 0) {
        formData.append(key, String(value));
      }
    });

  if (files?.birthCertificate?.uri) {
    formData.append("birthCertificate", {
      uri: files.birthCertificate.uri,
      name: files.birthCertificate.name,
      type: files.birthCertificate.mimeType || "application/octet-stream",
    } as any);
  }

  if (files?.parentId?.uri) {
    formData.append("parentId", {
      uri: files.parentId.uri,
      name: files.parentId.name,
      type: files.parentId.mimeType || "application/octet-stream",
    } as any);
  }

  const response = await fetch(`${API_BASE_URL}/api/children/enrollment-requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit enrollment request");
  }

  return data as ChildEnrollmentSubmissionResponse;
};

export const getMyEnrollmentRequests = async (
  token: string,
): Promise<TeacherEnrollmentRequest[]> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(
    `${API_BASE_URL}/api/children/enrollment-requests/mine`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch enrollment requests");
  }

  return Array.isArray(data.requests) ? data.requests : [];
};

export const resetEnrollmentRequestParentPassword = async (
  token: string,
  requestId: string,
): Promise<ParentResetPasswordResponse> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(
    `${API_BASE_URL}/api/children/enrollment-requests/${requestId}/reset-parent-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reset parent password");
  }

  return data as ParentResetPasswordResponse;
};

export const getEnrollmentRequestParentCredentials = async (
  token: string,
  requestId: string,
): Promise<ParentCredentialsResponse> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(
    `${API_BASE_URL}/api/children/enrollment-requests/${requestId}/parent-credentials`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch parent credentials");
  }

  return data as ParentCredentialsResponse;
};

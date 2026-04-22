import { API_BASE_URL } from "../config/config.api";
import type { Child, ChildDocumentIntegrity } from "./api.types";

export type {
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
  TeacherEnrollmentRequest,
  ParentResetPasswordResponse,
  ParentCredentialsResponse,
} from "./api.types";

import type {
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
  TeacherEnrollmentRequest,
  ParentResetPasswordResponse,
  ParentCredentialsResponse,
} from "./api.types";

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

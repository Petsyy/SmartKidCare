import { API_BASE } from "./config";
import { apiRequestOrThrow, parseApiError } from "./api-client";

export type EnrollmentRequestStatus = "pending" | "approved" | "rejected";

export interface ParentLinkedChildItem {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId?: string;
  source: "child" | "request";
  status?: EnrollmentRequestStatus | "linked";
}

export interface EnrollmentRequestItem {
  _id: string;
  status: EnrollmentRequestStatus;
  child: {
    fullName?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    gender: "male" | "female";
    programType?: "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)";
    enrollmentDate: string;
    schoolYear: string;
    weight?: number | null;
    height?: number | null;
    bmi?: number | null;
    nutritionalStatus?: string | null;
  };

  daycareCenter?: {
    _id: string;
    name: string;
    barangay: string;
    code: string;
    isActive?: boolean;
  } | null;

  parent: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
  };
  
  documents?: {
    birthCertificate?: {
      publicId?: string;
      resourceType?: string;
      format?: string;
      hash?: string;
    } | null;
    parentId?: {
      publicId?: string;
      resourceType?: string;
      format?: string;
      hash?: string;
    } | null;
  } | null;

  requestedBy?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
  } | null;

  review?: {
    reviewedAt?: string | null;
    reason?: string;
    reviewedBy?: {
      _id: string;
      firstName: string;
      middleName?: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
  
  createdChild?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    studentId: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export const resetUserPassword = async (userId: string) => {
  return apiRequestOrThrow<{ message?: string; credentials?: { email: string; tempPassword: string } }>(
    `/admin/users/${userId}/reset-password`,
    "Reset failed",
    { method: "POST" },
  );
};

export const toggleUserStatus = async (userId: string) => {
  return apiRequestOrThrow<{ isActive?: boolean; message?: string }>(
    `/admin/users/${userId}/toggle-status`,
    "Update failed",
    { method: "PATCH" },
  );
};

export const getParentChildren = async (parentId: string) => {
  const endpoint = `${API_BASE}/admin/parents/${parentId}/children`;
  type ParentChild = {
    _id: string | number;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    studentId?: string;
  };
  type ParentRequest = {
    _id: string | number;
    status?: EnrollmentRequestStatus;
    child?: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
    };
    createdChild?: {
      studentId?: string;
    };
  };
  type ParentChildrenResponse = {
    children?: ParentChild[];
    requests?: ParentRequest[];
    error?: string;
    message?: string;
  };

  const requestParentChildren = async (url: string) =>
    fetch(url, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

  let res = await requestParentChildren(endpoint);
  if (res.status === 304) {
    const cacheBustedUrl = `${endpoint}${endpoint.includes("?") ? "&" : "?"}_=${Date.now()}`;
    res = await requestParentChildren(cacheBustedUrl);
  }

  const raw = await res.text();
  let data: ParentChildrenResponse = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        data = parsed as ParentChildrenResponse;
      }
    } catch {
      data = {};
    }
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || (await parseApiError(res, "Fetch failed")));
  }
  const children = Array.isArray(data.children) ? data.children : ([] as ParentChild[]);
  const requests = Array.isArray(data.requests) ? data.requests : ([] as ParentRequest[]);

  return [
    ...children.map((child) => ({
      _id: String(child._id),
      firstName: child.firstName || "",
      middleName: child.middleName,
      lastName: child.lastName || "",
      studentId: child.studentId,
      source: "child" as const,
      status: "linked" as const,
    })),
    ...requests.map((request) => ({
      _id: String(request._id),
      firstName: request.child?.firstName || "",
      middleName: request.child?.middleName,
      lastName: request.child?.lastName || "",
      studentId: request.createdChild?.studentId,
      source: "request" as const,
      status: request.status as EnrollmentRequestStatus,
    })),
  ] as ParentLinkedChildItem[];
};

export const updateUser = async (
  userId: string,
  updates: { firstName?: string; middleName?: string; lastName?: string; email?: string; phone?: string },
) => {
  return apiRequestOrThrow<{ message?: string }>(
    `/admin/users/${userId}`,
    "Update failed",
    {
      method: "PATCH",
      body: updates,
    },
  );
};

export const deleteUser = async (userId: string) => {
  return apiRequestOrThrow<{ message?: string }>(
    `/admin/users/${userId}`,
    "Delete failed",
    { method: "DELETE" },
  );
};

export const getEnrollmentRequests = async (
  status?: EnrollmentRequestStatus,
): Promise<EnrollmentRequestItem[]> => {
  const query = new URLSearchParams();
  if (status) query.set("status", status);

  const data = await apiRequestOrThrow<{ requests?: EnrollmentRequestItem[] }>(
    `/enrollment/requests${query.toString() ? `?${query.toString()}` : ""}`,
    "Failed to fetch requests",
  );

  return Array.isArray(data.requests) ? data.requests : [];
};

export const reviewEnrollmentRequest = async (
  requestId: string,
  decision: "approved" | "rejected",
  reason?: string,
) => {
  return apiRequestOrThrow<{
    message: string;
    request: EnrollmentRequestItem;
    parentCredentials?: {
      email: string;
      tempPassword: string | null;
    };
  }>(
    `/enrollment/requests/${requestId}/review`,
    "Failed to review request",
    {
      method: "PATCH",
      body: { decision, reason },
    },
  );
};

export const deleteEnrollmentRequest = async (requestId: string) => {
  return apiRequestOrThrow<{ message: string }>(
    `/enrollment/requests/${requestId}`,
    "Failed to delete enrollment request",
    { method: "DELETE" },
  );
};

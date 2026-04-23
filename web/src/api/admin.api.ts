import { API_BASE } from "../components/config/config.api";

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
  const res = await fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Reset failed");
  return data;
};

export const toggleUserStatus = async (userId: string) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Update failed");
  return data;
};

export const getParentChildren = async (parentId: string) => {
  const endpoint = `${API_BASE}/admin/parents/${parentId}/children`;

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
  let data: any = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }
  if (!res.ok) {
    throw new Error(
      (data as { error?: string; message?: string }).error ||
      (data as { error?: string; message?: string }).message ||
      "Fetch failed",
    );
  }
  const children = Array.isArray(data.children) ? data.children : [];
  const requests = Array.isArray(data.requests) ? data.requests : [];

  return [
    ...children.map((child: any) => ({
      _id: String(child._id),
      firstName: child.firstName,
      middleName: child.middleName,
      lastName: child.lastName,
      studentId: child.studentId,
      source: "child" as const,
      status: "linked" as const,
    })),
    ...requests.map((request: any) => ({
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
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Update failed");
  return data;
};

export const deleteUser = async (userId: string) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Delete failed");
  return data;
};

export const getEnrollmentRequests = async (
  status?: EnrollmentRequestStatus,
): Promise<EnrollmentRequestItem[]> => {
  const query = new URLSearchParams();
  if (status) query.set("status", status);

  const res = await fetch(
    `${API_BASE}/children/enrollment-requests${query.toString() ? `?${query.toString()}` : ""
    }`,
    {
      credentials: "include",
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || data.message || "Failed to fetch requests");

  return Array.isArray(data.requests) ? data.requests : [];
};

export const reviewEnrollmentRequest = async (
  requestId: string,
  decision: "approved" | "rejected",
  reason?: string,
) => {
  const res = await fetch(
    `${API_BASE}/children/enrollment-requests/${requestId}/review`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decision, reason }),
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || data.message || "Failed to review request");

  return data as {
    message: string;
    request: EnrollmentRequestItem;
    parentCredentials?: {
      email: string;
      tempPassword: string | null;
    };
  };
};

export const deleteEnrollmentRequest = async (requestId: string) => {
  const res = await fetch(`${API_BASE}/children/enrollment-requests/${requestId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error || data.message || "Failed to delete enrollment request",
    );
  }

  return data as { message: string };
};


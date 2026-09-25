import { API_BASE } from "./config";
import { apiRequestOrThrow, parseApiError } from "./api-client";

export interface ParentLinkedChildItem {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId?: string;
  source: "child";
  status: "linked";
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

export const createCaptain = async (payload: {
  username: string; firstName: string; middleName?: string; lastName: string;
  email: string; phone: string; replaceCaptainId?: string;
}) => apiRequestOrThrow<{
  captain: { _id: string; firstName: string; lastName: string; email: string };
  assignedCenter: { _id: string; name: string };
  invitation: {
    status: "invitation_pending";
    expiresAt: string;
    delivery: { sent: boolean; message?: string };
  };
}>(
  "/admin/captains", "Failed to create Barangay Captain", { method: "POST", body: payload },
);

export const resendCaptainInvitation = (captainId: string) =>
  apiRequestOrThrow<{ expiresAt: string; delivery: { sent: boolean } }>(
    `/admin/captains/${captainId}/invitation/resend`,
    "Failed to resend invitation",
    { method: "POST" },
  );

export const revokeCaptainInvitation = (captainId: string) =>
  apiRequestOrThrow<void>(
    `/admin/captains/${captainId}/invitation`,
    "Failed to revoke invitation",
    { method: "DELETE" },
  );

export const validateCaptainInvitation = (token: string) =>
  apiRequestOrThrow<{ firstName: string; email: string; expiresAt: string }>(
    "/auth/captain-invitation/validate",
    "Invitation validation failed",
    { method: "POST", body: { token } },
  );

export const activateCaptainInvitation = (payload: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) =>
  apiRequestOrThrow<{ message: string }>(
    "/auth/captain-invitation/activate",
    "Account activation failed",
    { method: "POST", body: payload },
  );

export const getParentChildren = async (parentId: string) => {
  const endpoint = `${API_BASE}/admin/parents/${parentId}/children`;
  type ParentChild = {
    _id: string | number;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    studentId?: string;
  };
  type ParentChildrenResponse = {
    children?: ParentChild[];
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
  return children.map((child) => ({
    _id: String(child._id),
    firstName: child.firstName || "",
    middleName: child.middleName,
    lastName: child.lastName || "",
    studentId: child.studentId,
    source: "child" as const,
    status: "linked" as const,
  }));
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


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


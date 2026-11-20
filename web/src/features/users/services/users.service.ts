import { API_BASE } from "@/api/config";
import { apiRequestOrThrow, parseApiError } from "@/api/api-client";
import type {
  CreateTeacherResponse,
  GetUsersParams,
  ListTeachersParams,
  ParentLinkedChildItem,
  Teacher,
  TeacherData,
  User,
} from "../types";

export const getUsers = async (
  params?: GetUsersParams,
): Promise<User[]> => {
  const queryParams = new URLSearchParams();
  if (params?.role) {
    queryParams.append("role", params.role);
  }

  const result = await apiRequestOrThrow<{ users?: User[] }>(
    `/auth/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
    "Failed to fetch users",
  );

  return Array.isArray(result.users) ? result.users : [];
};

export const resetUserPassword = async (userId: string) => {
  return apiRequestOrThrow<{
    message?: string;
    credentials?: { email: string; tempPassword: string };
  }>(
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

export const getParentChildren = async (parentId: string): Promise<ParentLinkedChildItem[]> => {
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
  updates: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  },
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

export const createTeacher = async (
  data: TeacherData,
): Promise<CreateTeacherResponse> => {
  return apiRequestOrThrow<CreateTeacherResponse>(
    "/admin/teachers",
    "Failed to create teacher",
    {
      method: "POST",
      body: data,
    },
  );
};

export const getTeachers = async (
  params?: ListTeachersParams,
): Promise<Teacher[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const result = await apiRequestOrThrow<{ teachers?: Teacher[] }>(
    `/admin/teachers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
    "Failed to fetch teachers",
  );

  return Array.isArray(result.teachers) ? result.teachers : [];
};

export const getTeacher = async (teacherId: string): Promise<Teacher> => {
  const result = await apiRequestOrThrow<{ teacher: Teacher }>(
    `/admin/teachers/${teacherId}`,
    "Failed to fetch teacher",
  );
  return result.teacher;
};

export const updateTeacher = async (
  teacherId: string,
  data: Partial<TeacherData>,
): Promise<Teacher> => {
  const result = await apiRequestOrThrow<{ teacher: Teacher }>(
    `/admin/teachers/${teacherId}`,
    "Failed to update teacher",
    {
      method: "PATCH",
      body: data,
    },
  );
  return result.teacher;
};

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

export class UsersService {
  async getUsers(params?: GetUsersParams): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.role) {
      queryParams.append("role", params.role);
    }

    const result = await apiRequestOrThrow<{ users?: User[] }>(
      `/auth/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      "Failed to fetch users",
    );

    return Array.isArray(result.users) ? result.users : [];
  }

  async resetUserPassword(userId: string): Promise<{
    message?: string;
    credentials?: { email: string; tempPassword: string };
  }> {
    return apiRequestOrThrow<{
      message?: string;
      credentials?: { email: string; tempPassword: string };
    }>(`/admin/users/${userId}/reset-password`, "Reset failed", {
      method: "POST",
    });
  }

  async toggleUserStatus(userId: string): Promise<{
    isActive?: boolean;
    message?: string;
  }> {
    return apiRequestOrThrow<{ isActive?: boolean; message?: string }>(
      `/admin/users/${userId}/toggle-status`,
      "Update failed",
      { method: "PATCH" },
    );
  }

  async validateCaptainInvitation(token: string): Promise<{
    firstName: string;
    email: string;
    expiresAt: string;
  }> {
    return apiRequestOrThrow<{
      firstName: string;
      email: string;
      expiresAt: string;
    }>("/auth/captain-invitation/validate", "Invitation validation failed", {
      method: "POST",
      body: { token },
    });
  }

  async activateCaptainInvitation(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    return apiRequestOrThrow<{ message: string }>(
      "/auth/captain-invitation/activate",
      "Account activation failed",
      { method: "POST", body: payload },
    );
  }

  async getParentChildren(parentId: string): Promise<ParentLinkedChildItem[]> {
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
      throw new Error(
        data.error ||
          data.message ||
          (await parseApiError(res, "Fetch failed")),
      );
    }
    const children = Array.isArray(data.children)
      ? data.children
      : ([] as ParentChild[]);
    return children.map((child) => ({
      _id: String(child._id),
      firstName: child.firstName || "",
      middleName: child.middleName,
      lastName: child.lastName || "",
      studentId: child.studentId,
      source: "child" as const,
      status: "linked" as const,
    }));
  }

  async updateUser(
    userId: string,
    updates: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<{ message?: string }> {
    return apiRequestOrThrow<{ message?: string }>(
      `/admin/users/${userId}`,
      "Update failed",
      {
        method: "PATCH",
        body: updates,
      },
    );
  }

  async deleteUser(userId: string): Promise<{ message?: string }> {
    return apiRequestOrThrow<{ message?: string }>(
      `/admin/users/${userId}`,
      "Delete failed",
      { method: "DELETE" },
    );
  }

  async createTeacher(data: TeacherData): Promise<CreateTeacherResponse> {
    return apiRequestOrThrow<CreateTeacherResponse>(
      "/admin/teachers",
      "Failed to create teacher",
      {
        method: "POST",
        body: data,
      },
    );
  }

  async getTeachers(params?: ListTeachersParams): Promise<Teacher[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const result = await apiRequestOrThrow<{ teachers?: Teacher[] }>(
      `/admin/teachers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      "Failed to fetch teachers",
    );

    return Array.isArray(result.teachers) ? result.teachers : [];
  }

  async getTeacher(teacherId: string): Promise<Teacher> {
    const result = await apiRequestOrThrow<{ teacher: Teacher }>(
      `/admin/teachers/${teacherId}`,
      "Failed to fetch teacher",
    );
    return result.teacher;
  }

  async updateTeacher(
    teacherId: string,
    data: Partial<TeacherData>,
  ): Promise<Teacher> {
    const result = await apiRequestOrThrow<{ teacher: Teacher }>(
      `/admin/teachers/${teacherId}`,
      "Failed to update teacher",
      {
        method: "PATCH",
        body: data,
      },
    );
    return result.teacher;
  }
}

export const usersService = new UsersService();

// Bound method aliases for backwards compatibility
export const getUsers = (params?: GetUsersParams) =>
  usersService.getUsers(params);
export const resetUserPassword = (userId: string) =>
  usersService.resetUserPassword(userId);
export const toggleUserStatus = (userId: string) =>
  usersService.toggleUserStatus(userId);
export const validateCaptainInvitation = (token: string) =>
  usersService.validateCaptainInvitation(token);
export const activateCaptainInvitation = (payload: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) => usersService.activateCaptainInvitation(payload);
export const getParentChildren = (parentId: string) =>
  usersService.getParentChildren(parentId);
export const updateUser = (
  userId: string,
  updates: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  },
) => usersService.updateUser(userId, updates);
export const deleteUser = (userId: string) => usersService.deleteUser(userId);
export const createTeacher = (data: TeacherData) =>
  usersService.createTeacher(data);
export const getTeachers = (params?: ListTeachersParams) =>
  usersService.getTeachers(params);
export const getTeacher = (teacherId: string) =>
  usersService.getTeacher(teacherId);
export const updateTeacher = (teacherId: string, data: Partial<TeacherData>) =>
  usersService.updateTeacher(teacherId, data);

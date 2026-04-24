import { apiRequestOrThrow } from "./api-client";

export interface User {
  _id: string;
  username?: string;            // admin only
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;                // teacher/parent
  role: "admin" | "teacher" | "parent";
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
  role?: "teacher" | "parent" | "admin";
}

export const getUsers = async (
  params?: GetUsersParams
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

import { API_BASE } from "../components/config/config.api";

export interface User {
  _id: string;
  employeeId?: string;          // teacher only
  username?: string;            // admin only
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;                // teacher/parent
  role: "admin" | "teacher" | "parent";
  isActive?: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersParams {
  role?: "teacher" | "parent" | "admin";
}

export const getUsers = async (
  params?: GetUsersParams
): Promise<User[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.role) {
      queryParams.append("role", params.role);
    }

    const url = `${API_BASE}/auth/users${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch users");
    }

    const result = await response.json();
    return result.users;
  } catch (error: any) {
    throw new Error(error.message || "Network error");
  }
};

export default API_BASE;

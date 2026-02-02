const API_BASE_URL = "http://192.168.100.15:5000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoggedInUser {
  _id: string;
  email: string;
  role: "teacher" | "parent";
  firstName?: string;
  lastName?: string;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  token: string;
  user: LoggedInUser;
}

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  if (data.user.role === "admin") {
    throw new Error("Admin accounts cannot log in on the mobile app");
  }

  return data;
};

export const getMe = async (token: string): Promise<LoggedInUser> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user");
  }

  return data.user;
};

export interface Child {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  age: number;
  gender: string;
  studentId: string;
  schoolYear: string;
  status: string;
  enrollmentDate: string;
}

export const getMyChildren = async (token: string): Promise<Child[]> => {
  const response = await fetch(`${API_BASE_URL}/api/children/my-children`, {
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

export const linkChild = async (
  token: string,
  childLinkCode: string
): Promise<{ message: string; child: Child }> => {
  const response = await fetch(`${API_BASE_URL}/api/children/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ childLinkCode: childLinkCode.trim().toUpperCase() }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to link child");
  }

  return data;
};

export default API_BASE_URL;

import { API_BASE_URL } from "../config/config.api";

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
  dateOfBirth?: string;
  parent?: {
    phone: any;
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

export const getMyChildren = async (token: string): Promise<Child[]> => {
  if (!token) throw new Error("No authentication token");

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

export const getAllChildren = async (token: string): Promise<Child[]> => {
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

export const linkChild = async (
  token: string,
  childLinkCode: string,
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

export const getChildById = async (token: string, childId: string): Promise<Child> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/children/${childId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch child details");
  }

  return data;
};

export const getParentProfile = async (token: string) => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch parent profile");
  }

  return data.user;
};

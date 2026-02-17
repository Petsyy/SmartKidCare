import { API_BASE_URL } from "../config/config.api";
import { Child } from "./parent.api";

export const getChildren = async (token: string): Promise<Child[]> => {
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
export const getTeacherProfile = async (token: string) => {
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
    throw new Error(data.message || "Failed to fetch teacher profile");
  }

  return data.user;
};
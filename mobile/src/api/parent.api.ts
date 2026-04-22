import { API_BASE_URL } from "../config/config.api";

export type { Child, ChildDocumentIntegrity } from "./api.types";
import type { Child, ChildDocumentIntegrity } from "./api.types";

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

export const getChildById = async (
  token: string,
  childId: string,
): Promise<Child> => {
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

  const raw = await response.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message || raw || "Failed to fetch parent profile",
    );
  }

  if (!data?.user) {
    throw new Error("Invalid profile response from server");
  }

  return data.user;
};

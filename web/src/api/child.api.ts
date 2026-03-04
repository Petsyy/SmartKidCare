import { API_BASE } from "../components/config/config.api";

export type CreateChildPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  age: string | number;
  gender: string;
  enrollmentDate: string;
  schoolYear: string;
  status: string;
  teacherId?: string;
  parentFirstName: string;
  parentLastName: string;
  parentMiddleName?: string;
  parentEmail: string;
  parentPhone?: string;
};

export const createChild = async (
  payload: CreateChildPayload,
  files: {
    birthCertificate?: File;
    parentId?: File;
  },
) => {
  const formData = new FormData();

  (Object.keys(payload) as (keyof CreateChildPayload)[]).forEach((key) => {
    const value = payload[key];
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  if (files.birthCertificate) {
    formData.append("birthCertificate", files.birthCertificate);
  }
  if (files.parentId) {
    formData.append("parentId", files.parentId);
  }

  const res = await fetch(`${API_BASE}/children`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create child");
  return data;
};

export const getChildren = async () => {
  const res = await fetch(`${API_BASE}/children`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch children");
  return data;
};

export const getChildDocumentUrl = async (
  childId: string,
  documentType: "birth-certificate" | "parent-id",
) => {
  const tokenRes = await fetch(
    `${API_BASE}/children/${childId}/documents/${documentType}/url`,
    {
      credentials: "include",
    },
  );

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok)
    throw new Error(tokenData.message || "Failed to fetch document token");

  const { token, expiresInSeconds } = tokenData;
  if (!token) throw new Error("No access token was returned");

  return {
    url: `${API_BASE}/documents/view?token=${token}`,
    expiresInSeconds,
    documentType: tokenData.documentType,
  } as {
    url: string;
    expiresInSeconds: number;
    documentType: "birthCertificate" | "parentId";
  };
};

export const updateChild = async (
  childId: string,
  updates: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string;
    age?: number;
    gender?: string;
    enrollmentDate?: string;
    schoolYear?: string;
    status?: string;
    regenerateLinkCode?: boolean;
    unlinkParent?: boolean;
    teacherId?: string | null;
    unlinkTeacher?: boolean;
  },
) => {
  const res = await fetch(`${API_BASE}/children/${childId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update child");
  return data;
};

export const deleteChild = async (childId: string) => {
  const res = await fetch(`${API_BASE}/children/${childId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to delete child");
  return data;
};

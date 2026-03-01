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

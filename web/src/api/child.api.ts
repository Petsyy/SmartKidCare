import { API_BASE } from "../components/config/config.api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

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
  parentFirstName: string;
  parentLastName: string;
  parentMiddleName?: string;
  parentEmail: string;
  parentPhone?: string;
};

export const createChild = async (payload: CreateChildPayload) => {
  const res = await fetch(`${API_BASE}/children`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create child");
  return data;
};

export const getChildren = async () => {
  const res = await fetch(`${API_BASE}/children`, {
    headers: authHeaders(),
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
    schoolYear?: string;
    status?: string;
    regenerateLinkCode?: boolean;
    unlinkParent?: boolean;
  }
) => {
  const res = await fetch(`${API_BASE}/children/${childId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update child");
  return data;
};

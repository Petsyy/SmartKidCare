import { API_BASE } from "../components/config/config.api";

export const resetUserPassword = async (userId: string) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Reset failed");
  return data;
};

export const toggleUserStatus = async (userId: string) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Update failed");
  return data;
};

export const getParentChildren = async (parentId: string) => {
  const res = await fetch(`${API_BASE}/admin/parents/${parentId}/children`, {
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Fetch failed");
  return data; // children[]
};

export const updateUser = async (
  userId: string,
  updates: { firstName?: string; middleName?: string; lastName?: string; email?: string; phone?: string },
) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Update failed");
  return data;
};

export const deleteUser = async (userId: string) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Delete failed");
  return data;
};


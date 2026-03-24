import { API_BASE } from "../components/config/config.api";

export interface DaycareCenter {
  _id: string;
  name: string;
  barangay: string;
  code: string;
  address?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getDaycareCenters = async (): Promise<DaycareCenter[]> => {
  const response = await fetch(`${API_BASE}/admin/daycare-centers`, {
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || "Failed to fetch centers");
  }

  return Array.isArray(data.centers) ? data.centers : [];
};

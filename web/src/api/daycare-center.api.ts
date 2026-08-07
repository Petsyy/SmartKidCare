import { apiRequestOrThrow } from "./api-client";

export interface DaycareCenter {
  _id: string;
  name: string;
  barangay: string;
  code: string;
  address?: string;
  isActive: boolean;
  assignedCDW?: string;
  childrenCount?: number;
  attendanceToday?: { present: number; total: number };
  lastActivity?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getDaycareCenters = async (): Promise<DaycareCenter[]> => {
  const data = await apiRequestOrThrow<{ centers?: DaycareCenter[] }>(
    "/admin/daycare-centers",
    "Failed to fetch centers",
  );

  return Array.isArray(data.centers) ? data.centers : [];
};

import { apiRequestOrThrow } from "@/api/api-client";
import type { DaycareCenter } from "../types";

export const getDaycareCenters = async (): Promise<DaycareCenter[]> => {
  const data = await apiRequestOrThrow<{ centers?: DaycareCenter[] }>(
    "/admin/daycare-centers",
    "Failed to fetch centers",
  );

  return Array.isArray(data.centers) ? data.centers : [];
};

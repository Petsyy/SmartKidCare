import { apiRequestOrThrow } from "@/api/api-client";
import type { DaycareCenter } from "../types";

export class CentersService {
  async getDaycareCenters(): Promise<DaycareCenter[]> {
    const data = await apiRequestOrThrow<{ centers?: DaycareCenter[] }>(
      "/admin/daycare-centers",
      "Failed to fetch centers",
    );

    return Array.isArray(data.centers) ? data.centers : [];
  }
}

export const centersService = new CentersService();

export const getDaycareCenters = () => centersService.getDaycareCenters();

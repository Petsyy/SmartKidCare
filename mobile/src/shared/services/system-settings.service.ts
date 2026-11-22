import { apiClient } from "@/src/api/client";

export type SystemSettings = {
  schoolName: string;
  address: string;
};

export class SystemSettingsService {
  async getSystemSettings(): Promise<SystemSettings> {
    const data = await apiClient<{ data: SystemSettings }>("/settings", {
      method: "GET",
    });
    return data.data;
  }
}

export const systemSettingsService = new SystemSettingsService();

// Backwards-compatible bound alias
export const getSystemSettings = () => systemSettingsService.getSystemSettings();

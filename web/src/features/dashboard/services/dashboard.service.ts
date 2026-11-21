import { apiRequestOrThrow } from "@/api/api-client";
import type { DashboardReport } from "../types";

export class DashboardService {
  async getDashboardAnalytics(
    datePreset: "7d" | "30d" = "7d",
  ): Promise<DashboardReport> {
    return apiRequestOrThrow<DashboardReport>(
      `/reports/admin-analytics?datePreset=${datePreset}&limit=1`,
      "Failed to load dashboard analytics",
    );
  }
}

export const dashboardService = new DashboardService();

// Bound method alias for backwards compatibility
export const getDashboardAnalytics = (datePreset: "7d" | "30d" = "7d") =>
  dashboardService.getDashboardAnalytics(datePreset);

import { apiRequestOrThrow } from "@/api/api-client";
import type { DashboardReport } from "../types";

export const getDashboardAnalytics = (
  datePreset: "7d" | "30d" = "7d",
): Promise<DashboardReport> =>
  apiRequestOrThrow<DashboardReport>(
    `/reports/admin-analytics?datePreset=${datePreset}&limit=1`,
    "Failed to load dashboard analytics",
  );

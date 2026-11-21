import { apiRequestOrThrow } from "@/api/api-client";
import type {
  AdminReportPayload,
  CompetencyAnalyticsPayload,
} from "../types";

export class ReportsService {
  async getCompetencyAnalytics(
    schoolYear: string = "all",
  ): Promise<CompetencyAnalyticsPayload> {
    const params = new URLSearchParams();
    if (schoolYear !== "all") params.set("schoolYear", schoolYear);
    const suffix = params.size ? `?${params.toString()}` : "";

    return apiRequestOrThrow<CompetencyAnalyticsPayload>(
      `/competencies/analytics${suffix}`,
      "Unable to load competency analytics",
    );
  }

  async getReportAnalytics(
    queryParams: string,
  ): Promise<AdminReportPayload> {
    return apiRequestOrThrow<AdminReportPayload>(
      `/reports/admin-analytics?${queryParams}`,
      "Unable to load report analytics",
    );
  }
}

export const reportsService = new ReportsService();

// Bound method aliases for backwards compatibility
export const getCompetencyAnalytics = (schoolYear: string = "all") =>
  reportsService.getCompetencyAnalytics(schoolYear);
export const getReportAnalytics = (queryParams: string) =>
  reportsService.getReportAnalytics(queryParams);

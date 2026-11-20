import { apiRequestOrThrow } from "@/api/api-client";
import type {
  AdminReportPayload,
  CompetencyAnalyticsPayload,
} from "../types";

export const getCompetencyAnalytics = async (
  schoolYear: string = "all",
): Promise<CompetencyAnalyticsPayload> => {
  const params = new URLSearchParams();
  if (schoolYear !== "all") params.set("schoolYear", schoolYear);
  const suffix = params.size ? `?${params.toString()}` : "";

  return apiRequestOrThrow<CompetencyAnalyticsPayload>(
    `/competencies/analytics${suffix}`,
    "Unable to load competency analytics",
  );
};

export const getReportAnalytics = async (
  queryParams: string,
): Promise<AdminReportPayload> => {
  return apiRequestOrThrow<AdminReportPayload>(
    `/reports/admin-analytics?${queryParams}`,
    "Unable to load report analytics",
  );
};

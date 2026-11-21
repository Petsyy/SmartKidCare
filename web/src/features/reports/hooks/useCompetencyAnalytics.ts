import { useQuery } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";
import { reportsService } from "../services/reports.service";

export type {
  CompetencyPeriod,
  CompetencyAnalyticsItem,
  CompetencyAnalyticsPayload,
} from "../types";

export function useCompetencyAnalytics() {
  const schoolYear = "all";

  const query = useQuery({
    queryKey: webQueryKeys.competencyAnalytics("all", schoolYear),
    queryFn: () => reportsService.getCompetencyAnalytics(schoolYear),
  });

  return {
    ...query,
    schoolYear,
    errorMessage:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Unable to load competency analytics."
          : null,
  };
}

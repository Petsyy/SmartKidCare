import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/api/config";
import { webQueryKeys } from "@/lib/query-keys";

export type CompetencyPeriod = "all" | "initial" | "midyear" | "final";

export type CompetencyAnalyticsItem = {
  competencyId: string;
  code: string;
  name: string;
  category: string;
  distribution: {
    not_demonstrated: number;
    emerging: number;
    developing: number;
    achieved: number;
  };
  totalEvaluated: number;
  achievedRate: number;
};

export type CompetencyAnalyticsPayload = {
  filters: {
    period: CompetencyPeriod;
    schoolYear: string;
    centerId: string | null;
  };
  totalStudents: number;
  schoolYears: string[];
  competencies: CompetencyAnalyticsItem[];
};

export function useCompetencyAnalytics(centerId = "") {
  const [period, setPeriod] = useState<CompetencyPeriod>("all");
  const [schoolYear, setSchoolYear] = useState("all");

  const query = useQuery({
    queryKey: webQueryKeys.competencyAnalytics(
      period,
      schoolYear,
      centerId || "all-centers",
    ),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period !== "all") params.set("period", period);
      if (schoolYear !== "all") params.set("schoolYear", schoolYear);
      if (centerId) params.set("centerId", centerId);
      const suffix = params.size ? `?${params.toString()}` : "";
      const response = await fetch(
        `${API_BASE}/competencies/analytics${suffix}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ||
            `Unable to load competency analytics (${response.status})`,
        );
      }
      return payload as CompetencyAnalyticsPayload;
    },
  });

  return {
    ...query,
    period,
    setPeriod,
    schoolYear,
    setSchoolYear,
    errorMessage:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Unable to load competency analytics."
          : null,
  };
}

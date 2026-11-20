import type {
  CompetencyAnalyticsItem,
  CompetencyAnalyticsPayload,
} from "../types";

export type ComputedCompetencyItem = {
  competencyId: string;
  name: string;
  category: string;
  quarterly?: CompetencyAnalyticsItem;
  final?: CompetencyAnalyticsItem;
};

export type ComputedRatingData = {
  name: string;
  quarterly: number;
  final: number;
};

export type ComputedCompetencyAnalytics = {
  quarterlyCount: number;
  finalCount: number;
  hasData: boolean;
  competencies: ComputedCompetencyItem[];
  ratingData: ComputedRatingData[];
};

export const computeCompetencyAnalyticsData = (
  data: CompetencyAnalyticsPayload | undefined,
): ComputedCompetencyAnalytics => {
  const quarterlyCount = data?.periods?.quarterly?.totalStudents ?? 0;
  const finalCount = data?.periods?.final?.totalStudents ?? 0;
  const hasData = quarterlyCount + finalCount > 0;
  const quarterlyCompetencies = data?.periods?.quarterly?.competencies ?? [];
  const finalCompetencies = data?.periods?.final?.competencies ?? [];

  const finalByCompetency = new Map(
    finalCompetencies.map((item) => [item.competencyId, item]),
  );
  const competencyIds = new Set([
    ...quarterlyCompetencies.map((item) => item.competencyId),
    ...finalCompetencies.map((item) => item.competencyId),
  ]);

  const competencies: ComputedCompetencyItem[] = Array.from(competencyIds).map(
    (competencyId) => {
      const quarterly = quarterlyCompetencies.find(
        (item) => item.competencyId === competencyId,
      );
      const final = finalByCompetency.get(competencyId);
      const identity = quarterly || final!;
      return {
        competencyId,
        name: identity.name,
        category: identity.category,
        quarterly,
        final,
      };
    },
  );

  const totalForLevel = (
    period: CompetencyAnalyticsItem[],
    level: "achieved" | "developing" | "emerging" | "not_demonstrated",
  ) => period.reduce((total, item) => total + item.distribution[level], 0);

  const ratingData: ComputedRatingData[] = [
    {
      name: "Achieved",
      quarterly: totalForLevel(quarterlyCompetencies, "achieved"),
      final: totalForLevel(finalCompetencies, "achieved"),
    },
    {
      name: "Developing",
      quarterly: totalForLevel(quarterlyCompetencies, "developing"),
      final: totalForLevel(finalCompetencies, "developing"),
    },
    {
      name: "Emerging",
      quarterly: totalForLevel(quarterlyCompetencies, "emerging"),
      final: totalForLevel(finalCompetencies, "emerging"),
    },
    {
      name: "Not Demonstrated",
      quarterly: totalForLevel(quarterlyCompetencies, "not_demonstrated"),
      final: totalForLevel(finalCompetencies, "not_demonstrated"),
    },
  ];

  return {
    quarterlyCount,
    finalCount,
    hasData,
    competencies,
    ratingData,
  };
};

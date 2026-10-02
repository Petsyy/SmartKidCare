import { useQuery } from "@tanstack/react-query";
import { getNutritionAnalytics } from "@/api/nutrition.api";
import { webQueryKeys } from "@/lib/query-keys";

export function useNutritionAnalytics() {
  const schoolYear = "";
  const query = useQuery({
    queryKey: webQueryKeys.nutritionAnalytics(schoolYear || "latest"),
    queryFn: () =>
      getNutritionAnalytics({ schoolYear: schoolYear || undefined }),
  });

  return {
    ...query,
    schoolYear,
    errorMessage:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Unable to load nutrition analytics."
          : null,
  };
}

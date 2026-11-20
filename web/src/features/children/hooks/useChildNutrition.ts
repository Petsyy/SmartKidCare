import { useQuery } from "@tanstack/react-query";
import { getChildNutritionHistory } from "../services/nutrition.service";

export function useChildNutrition(childId: string) {
  return useQuery({
    queryKey: ["child-nutrition", childId],
    queryFn: () => getChildNutritionHistory(childId),
    enabled: !!childId,
  });
}

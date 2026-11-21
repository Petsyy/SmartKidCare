import { useQuery } from "@tanstack/react-query";
import { nutritionService } from "../services/nutrition.service";

export function useChildNutrition(childId: string) {
  return useQuery({
    queryKey: ["child-nutrition", childId],
    queryFn: () => nutritionService.getChildNutritionHistory(childId),
    enabled: !!childId,
  });
}

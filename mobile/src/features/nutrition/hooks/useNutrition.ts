import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyClassNutrition,
  evaluateNutrition,
  getChildNutritionHistory,
} from "../../../api/nutrition.api";
import type { NutritionPeriod } from "../../../api/nutrition.api";

export const useMyClassNutrition = (
  schoolYear: string,
  period?: NutritionPeriod,
) => {
  return useQuery({
    queryKey: ["my-class-nutrition", schoolYear, period],
    queryFn: () => getMyClassNutrition(schoolYear, period),
  });
};

export const useEvaluateNutrition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: evaluateNutrition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "my-class-nutrition",
          variables.schoolYear,
          variables.period,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["child-nutrition", variables.childId],
      });
      queryClient.invalidateQueries({ queryKey: ["teacherDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["teacherChildrenOverview"] });
    },
  });
};

export const useChildNutritionHistory = (childId: string) => {
  return useQuery({
    queryKey: ["child-nutrition", childId],
    queryFn: () => getChildNutritionHistory(childId),
    enabled: !!childId,
  });
};

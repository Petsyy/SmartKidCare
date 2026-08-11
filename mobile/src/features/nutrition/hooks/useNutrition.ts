import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyClassNutrition,
  evaluateNutrition,
  getChildNutritionHistory,
} from "../api/nutrition.api";

export const useMyClassNutrition = (
  schoolYear: string,
  period: "initial" | "final",
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

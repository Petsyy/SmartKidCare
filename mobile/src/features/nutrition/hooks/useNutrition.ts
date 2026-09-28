import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyClassNutrition,
  evaluateNutrition,
  getChildNutritionHistory,
} from "../../../api/nutrition.api";
import type {
  NutritionPeriod,
  NutritionRecord,
} from "../../../api/nutrition.api";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import {
  onlineWithOfflineFallback,
  readOfflineResource,
} from "@/src/offline/offline-read";
import type { Child } from "@/src/api/api.types";

export const useMyClassNutrition = (
  schoolYear: string,
  period?: NutritionPeriod,
) => {
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  return useQuery({
    queryKey: ["my-class-nutrition", schoolYear, period],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return onlineWithOfflineFallback(
        isOffline,
        () => getMyClassNutrition(schoolYear, period),
        async () => {
          const [children, records] = await Promise.all([
            readOfflineResource<Child>(user.id, "children"),
            readOfflineResource<NutritionRecord>(user.id, "nutrition"),
          ]);
          return children.map((child) => ({
            child,
            record:
              records.find(
                (record) =>
                  String(record.childId) === child._id &&
                  record.schoolYear === schoolYear &&
                  (!period || record.period === period),
              ) ?? null,
            initialRecord:
              period === "final"
                ? (records.find(
                    (record) =>
                      String(record.childId) === child._id &&
                      record.schoolYear === schoolYear &&
                      record.period === "initial",
                  ) ?? null)
                : null,
          }));
        },
      );
    },
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
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  return useQuery({
    queryKey: ["child-nutrition", childId],
    queryFn: () =>
      !user?.id
        ? Promise.resolve([])
        : onlineWithOfflineFallback(
            isOffline,
            () => getChildNutritionHistory(childId),
            async () =>
              (
                await readOfflineResource<NutritionRecord>(user.id, "nutrition")
              ).filter((record) => String(record.childId) === childId),
          ),
    enabled: !!childId,
  });
};

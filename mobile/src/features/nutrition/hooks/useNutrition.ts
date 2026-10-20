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
import { getManilaDateKey } from "@/src/utils/manila-date";
import { compareChildrenByName } from "@/src/utils/child-name";

export const useMyClassNutrition = (
  schoolYear: string,
  period?: NutritionPeriod,
  measurementDateKey?: string,
) => {
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  return useQuery({
    queryKey: ["my-class-nutrition", schoolYear, period, measurementDateKey],
    networkMode: "always",
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return onlineWithOfflineFallback(
        isOffline,
        () => getMyClassNutrition(schoolYear, period, measurementDateKey),
        async () => {
          const [children, records] = await Promise.all([
            readOfflineResource<Child>(user.id, "children"),
            readOfflineResource<NutritionRecord>(user.id, "nutrition"),
          ]);
          const sortedRecords = [...records].sort(
            (left, right) =>
              new Date(right.measurementDate).getTime() -
              new Date(left.measurementDate).getTime(),
          );
          return children.map((child) => {
            const childRecords = sortedRecords.filter(
              (record) =>
                String(record.childId) === child._id &&
                record.schoolYear === schoolYear &&
                (!period || record.period === period),
            );
            return {
              child,
              record:
                childRecords.find((record) => record.status === "submitted") ??
                childRecords[0] ??
                null,
              selectedRecord:
                childRecords.find(
                  (record) =>
                    !measurementDateKey ||
                    record.measurementDateKey === measurementDateKey ||
                    getManilaDateKey(new Date(record.measurementDate)) ===
                      measurementDateKey,
                ) ?? null,
              initialRecord:
                period === "final"
                  ? (sortedRecords.find(
                      (record) =>
                        String(record.childId) === child._id &&
                        record.schoolYear === schoolYear &&
                        record.period === "initial",
                    ) ?? null)
                  : null,
            };
          });
        },
      );
    },
    select: (students) =>
      [...students].sort((left, right) =>
        compareChildrenByName(left.child, right.child),
      ),
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
    networkMode: "always",
    queryFn: () =>
      !user?.id
        ? Promise.resolve([])
        : onlineWithOfflineFallback(
            isOffline,
            () => getChildNutritionHistory(childId),
            async () =>
              (await readOfflineResource<NutritionRecord>(user.id, "nutrition"))
                .filter((record) => String(record.childId) === childId)
                .sort(
                  (left, right) =>
                    new Date(right.measurementDate).getTime() -
                    new Date(left.measurementDate).getTime(),
                ),
          ),
    enabled: !!childId,
  });
};

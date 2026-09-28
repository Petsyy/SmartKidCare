import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGuardians, addGuardian, updateGuardian, removeGuardian } from "@/src/api/pickup.api";
import type { Guardian } from "@/src/api/api.types";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import { readOfflineResource, onlineWithOfflineFallback } from "@/src/offline/offline-read";

export const useGuardians = (childId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const queryKey = ["guardians", childId];

  const { data: guardians = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => onlineWithOfflineFallback(
      isOffline,
      () => getGuardians(childId!),
      async () => {
        if (!user?.id) return [];
        const summaries = await readOfflineResource<(Guardian & { childId: string; guardianIndex: number })>(user.id, "guardianSummaries");
        return summaries.filter((item) => item.childId === childId)
          .sort((a, b) => a.guardianIndex - b.guardianIndex);
      },
    ),
    enabled: !!childId,
    networkMode: "always",
  });

  useFocusEffect(
    useCallback(() => {
      if (childId) {
        refetch();
      }
    }, [childId, refetch])
  );

  const addMutation = useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: Partial<Guardian>;
      files?: { guardianPhoto?: any; guardianId?: any };
    }) => {
      if (isOffline) throw new Error("Connect to the internet to perform this action.");
      return addGuardian(childId!, data, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      index,
      data,
      files,
    }: {
      index: number;
      data: Partial<Guardian>;
      files?: { guardianPhoto?: any; guardianId?: any };
    }) => {
      if (isOffline) throw new Error("Connect to the internet to perform this action.");
      return updateGuardian(childId!, index, data, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      if (childId) {
        queryClient.invalidateQueries({ queryKey: mobileQueryKeys.teacherChildDetails(childId) });
        queryClient.invalidateQueries({ queryKey: mobileQueryKeys.teacherChildrenOverview() });
      }
      setEditingIndex(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (index: number) => {
      if (isOffline) throw new Error("Connect to the internet to perform this action.");
      return removeGuardian(childId!, index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      if (childId) {
        queryClient.invalidateQueries({ queryKey: mobileQueryKeys.teacherChildDetails(childId) });
        queryClient.invalidateQueries({ queryKey: mobileQueryKeys.teacherChildrenOverview() });
      }
    },
  });

  return {
    guardians,
    isLoading,
    error,
    isAdding,
    setIsAdding,
    editingIndex,
    setEditingIndex,
    addGuardian: addMutation.mutateAsync,
    updateGuardian: updateMutation.mutateAsync,
    removeGuardian: removeMutation.mutateAsync,
    isMutating: addMutation.isPending || updateMutation.isPending || removeMutation.isPending,
    isOffline,
  };
};

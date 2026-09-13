import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGuardians, addGuardian, updateGuardian, removeGuardian } from "@/src/api/pickup.api";
import type { Guardian } from "@/src/api/api.types";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export const useGuardians = (childId: string | undefined) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const queryKey = ["guardians", childId];

  const { data: guardians = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getGuardians(childId!),
    enabled: !!childId,
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
    }) => addGuardian(childId!, data, files),
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
    }) => updateGuardian(childId!, index, data, files),
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
    mutationFn: (index: number) => removeGuardian(childId!, index),
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
  };
};

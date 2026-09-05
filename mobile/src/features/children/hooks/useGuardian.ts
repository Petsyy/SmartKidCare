import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGuardians, addGuardian, updateGuardian, removeGuardian } from "@/src/api/pickup.api";
import type { Guardian } from "@/src/api/api.types";

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
    mutationFn: (data: Guardian) => addGuardian(childId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ index, data }: { index: number; data: Partial<Guardian> }) =>
      updateGuardian(childId!, index, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingIndex(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (index: number) => removeGuardian(childId!, index),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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

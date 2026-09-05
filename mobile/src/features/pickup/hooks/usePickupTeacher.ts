import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPickupEligibleChildren,
  verifyPickupCode,
  manualRelease,
} from "@/src/api/pickup.api";

export const usePickupTeacher = () => {
  const queryClient = useQueryClient();

  const {
    data: eligibleChildren = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pickupEligibleChildren"],
    queryFn: () => getPickupEligibleChildren(),
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      childId,
      code,
      notes,
    }: {
      childId: string;
      code: string;
      notes?: string;
    }) => verifyPickupCode(childId, code, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickupEligibleChildren"] });
    },
  });

  const manualReleaseMutation = useMutation({
    mutationFn: ({
      childId,
      pickedUpByType,
      guardianIndex,
      notes,
    }: {
      childId: string;
      pickedUpByType: "parent" | "guardian";
      guardianIndex: number | null;
      notes: string;
    }) => manualRelease(childId, pickedUpByType, guardianIndex, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickupEligibleChildren"] });
    },
  });

  return {
    eligibleChildren,
    isLoading,
    refetch,
    verifyCode: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    manualRelease: manualReleaseMutation.mutateAsync,
    isReleasing: manualReleaseMutation.isPending,
  };
};

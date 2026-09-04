import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPickupStatus, requestPickupCode } from "@/src/api/pickup.api";

export const usePickupParent = (childId: string) => {
  const queryClient = useQueryClient();

  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ["pickupStatus", childId],
    queryFn: () => getPickupStatus(childId),
  });

  const requestCodeMutation = useMutation({
    mutationFn: (intendedGuardianIndex: number | null) => requestPickupCode(childId, intendedGuardianIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickupStatus", childId] });
    },
  });

  return {
    statusData,
    isLoading,
    refetch,
    requestCode: requestCodeMutation.mutateAsync,
    isRequesting: requestCodeMutation.isPending,
  };
};

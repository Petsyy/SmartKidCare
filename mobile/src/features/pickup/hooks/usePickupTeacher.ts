import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPickupEligibleChildren,
  verifyPickupCode,
  manualRelease,
} from "@/src/api/pickup.api";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import { readOfflineResource, onlineWithOfflineFallback } from "@/src/offline/offline-read";
import type { PickupEligibleChild } from "@/src/api/api.types";

export const usePickupTeacher = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;

  const {
    data: eligibleChildren = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pickupEligibleChildren"],
    queryFn: () => onlineWithOfflineFallback(isOffline, getPickupEligibleChildren, async () => {
      if (!user?.id) return [];
      const [children, statuses] = await Promise.all([
        readOfflineResource<PickupEligibleChild>(user.id, "children"),
        readOfflineResource<{ childId: string; eligible: boolean; status: "pending" | "released" }>(user.id, "pickupStatuses"),
      ]);
      const eligible = new Set(statuses.filter((item) => item.eligible && item.status === "pending").map((item) => item.childId));
      return children.filter((child) => eligible.has(child._id));
    }),
    networkMode: "always",
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
    }) => {
      if (isOffline) throw new Error("Connect to the internet to perform this action.");
      return verifyPickupCode(childId, code, notes);
    },
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
      isVisuallyVerified,
    }: {
      childId: string;
      pickedUpByType: "parent" | "guardian";
      guardianIndex: number | null;
      notes: string;
      isVisuallyVerified?: boolean;
    }) => {
      if (isOffline) throw new Error("Connect to the internet to perform this action.");
      return manualRelease(
        childId,
        pickedUpByType,
        guardianIndex,
        notes,
        isVisuallyVerified ?? false,
      );
    },
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
    isOffline,
  };
};

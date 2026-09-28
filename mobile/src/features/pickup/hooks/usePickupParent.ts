import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPickupStatus, requestPickupCode } from "@/src/api/pickup.api";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import { readOfflineResource, onlineWithOfflineFallback } from "@/src/offline/offline-read";
import type { PickupStatusResponse } from "@/src/api/api.types";

export const usePickupParent = (childId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;

  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ["pickupStatus", childId],
    queryFn: () => onlineWithOfflineFallback(isOffline, () => getPickupStatus(childId), async () => {
      if (!user?.id) return { status: "pending" } as PickupStatusResponse;
      const statuses = await readOfflineResource<(PickupStatusResponse & { childId: string })>(user.id, "pickupStatuses");
      return statuses.find((item) => item.childId === childId) ?? ({ status: "pending" } as PickupStatusResponse);
    }),
    networkMode: "always",
  });

  const requestCodeMutation = useMutation({
    mutationFn: (intendedGuardianIndex: number | null) => {
      if (isOffline) throw new Error("Connect to the internet to perform this action.");
      return requestPickupCode(childId, intendedGuardianIndex);
    },
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
    isOffline,
  };
};

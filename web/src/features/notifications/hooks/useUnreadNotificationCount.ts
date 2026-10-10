import { useQuery } from "@tanstack/react-query";
import { getAdminUnreadNotificationCount } from "@/features/notifications/api/notificationApi";
import { notificationQueryKeys } from "@/features/notifications/queryKeys";

export const useUnreadNotificationCount = (userId: string) =>
  useQuery({
    queryKey: notificationQueryKeys.unread(userId),
    queryFn: getAdminUnreadNotificationCount,
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10_000,
  });


import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAdminNotificationFeed } from "@/features/notifications/api/notificationApi";
import { notificationQueryKeys } from "@/features/notifications/queryKeys";
import type {
  AdminNotification,
  AdminNotificationView,
} from "@/features/notifications/types/notification.types";

export const useAdminNotifications = (input: {
  userId: string;
  view: AdminNotificationView;
  enabled: boolean;
}) => {
  const query = useInfiniteQuery({
    queryKey: notificationQueryKeys.feed(input.userId, input.view),
    queryFn: ({ pageParam }) =>
      getAdminNotificationFeed({
        view: input.view,
        cursor: pageParam || undefined,
        limit: 20,
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: input.enabled && Boolean(input.userId),
    refetchInterval: input.enabled ? 30_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 5_000,
  });

  const notifications = useMemo(() => {
    const unique = new Map<string, AdminNotification>();
    query.data?.pages.forEach((page) => {
      page.items.forEach((notification) => {
        unique.set(notification.id, notification);
      });
    });
    return Array.from(unique.values());
  }, [query.data?.pages]);

  return { ...query, notifications };
};


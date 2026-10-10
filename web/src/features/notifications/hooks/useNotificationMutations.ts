import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  markAllAdminNotificationsRead,
  setAdminNotificationArchived,
  setAdminNotificationRead,
} from "@/features/notifications/api/notificationApi";
import { notificationQueryKeys } from "@/features/notifications/queryKeys";
import type {
  AdminNotification,
  AdminNotificationFeedResponse,
  AdminNotificationView,
} from "@/features/notifications/types/notification.types";

type FeedData = InfiniteData<AdminNotificationFeedResponse, string>;
type FeedSnapshot = Array<[QueryKey, FeedData | undefined]>;

const getViewFromKey = (key: QueryKey): AdminNotificationView | null => {
  const value = key[3];
  return value === "inbox" || value === "unread" || value === "archived"
    ? value
    : null;
};

const findNotification = (
  snapshots: FeedSnapshot,
  id: string,
): AdminNotification | undefined => {
  for (const [, data] of snapshots) {
    for (const page of data?.pages ?? []) {
      const notification = page.items.find((item) => item.id === id);
      if (notification) return notification;
    }
  }
  return undefined;
};

export const useNotificationMutations = (userId: string) => {
  const queryClient = useQueryClient();
  const rootKey = notificationQueryKeys.root();

  const snapshot = async () => {
    await queryClient.cancelQueries({ queryKey: rootKey });
    return {
      feeds: queryClient.getQueriesData<FeedData>({ queryKey: rootKey }),
      unreadCount: queryClient.getQueryData<number>(
        notificationQueryKeys.unread(userId),
      ),
    };
  };

  const restore = (context?: {
    feeds: FeedSnapshot;
    unreadCount: number | undefined;
  }) => {
    context?.feeds.forEach(([key, data]) => {
      queryClient.setQueryData(key, data);
    });
    if (context?.unreadCount !== undefined) {
      queryClient.setQueryData(
        notificationQueryKeys.unread(userId),
        context.unreadCount,
      );
    }
  };

  const updateFeeds = (
    updater: (
      notification: AdminNotification,
      view: AdminNotificationView,
    ) => AdminNotification | null,
    unreadCount: number,
  ) => {
    const feeds = queryClient.getQueriesData<FeedData>({ queryKey: rootKey });
    feeds.forEach(([key, data]) => {
      const view = getViewFromKey(key);
      if (!data || !view) return;
      queryClient.setQueryData<FeedData>(key, {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          unreadCount,
          items: page.items
            .map((item) => updater(item, view))
            .filter((item): item is AdminNotification => item !== null),
        })),
      });
    });
    queryClient.setQueryData(
      notificationQueryKeys.unread(userId),
      unreadCount,
    );
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: rootKey });

  const readMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      setAdminNotificationRead(id, read),
    onMutate: async ({ id, read }) => {
      const context = await snapshot();
      const previous = findNotification(context.feeds, id);
      const currentCount = context.unreadCount ?? 0;
      const countDelta = previous
        ? read && !previous.readAt
          ? -1
          : !read && previous.readAt
            ? 1
            : 0
        : 0;
      const nextCount = Math.max(0, currentCount + countDelta);
      const timestamp = new Date().toISOString();
      updateFeeds((notification, view) => {
        if (notification.id !== id) return notification;
        if (read && view === "unread") return null;
        return { ...notification, readAt: read ? timestamp : null };
      }, nextCount);
      return context;
    },
    onError: (_error, _variables, context) => restore(context),
    onSettled: invalidate,
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      setAdminNotificationArchived(id, archived),
    onMutate: async ({ id, archived }) => {
      const context = await snapshot();
      const previous = findNotification(context.feeds, id);
      const currentCount = context.unreadCount ?? 0;
      const nextCount = Math.max(
        0,
        currentCount - (archived && previous && !previous.readAt ? 1 : 0),
      );
      const timestamp = new Date().toISOString();
      updateFeeds((notification, view) => {
        if (notification.id !== id) return notification;
        if (archived && view !== "archived") return null;
        if (!archived && view === "archived") return null;
        return {
          ...notification,
          archivedAt: archived ? timestamp : null,
          readAt: archived ? notification.readAt ?? timestamp : notification.readAt,
        };
      }, nextCount);
      return context;
    },
    onError: (_error, _variables, context) => restore(context),
    onSettled: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAdminNotificationsRead,
    onMutate: async () => {
      const context = await snapshot();
      const timestamp = new Date().toISOString();
      updateFeeds((notification, view) => {
        if (view === "unread") return null;
        return notification.archivedAt
          ? notification
          : { ...notification, readAt: notification.readAt ?? timestamp };
      }, 0);
      return context;
    },
    onError: (_error, _variables, context) => restore(context),
    onSettled: invalidate,
  });

  const errors = [
    readMutation.error,
    archiveMutation.error,
    markAllReadMutation.error,
  ];
  const error = errors.find((value): value is Error => value instanceof Error);

  return {
    setRead: readMutation.mutate,
    setReadAsync: readMutation.mutateAsync,
    setArchived: archiveMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMutating:
      readMutation.isPending ||
      archiveMutation.isPending ||
      markAllReadMutation.isPending,
    errorMessage: error?.message ?? null,
    clearErrors: () => {
      readMutation.reset();
      archiveMutation.reset();
      markAllReadMutation.reset();
    },
  };
};


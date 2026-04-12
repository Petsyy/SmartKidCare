import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadNotificationArchiveState,
  saveNotificationArchiveState,
  type NotificationArchiveBaseItem,
  type ArchivedNotificationItem,
  type NotificationAudience,
} from "@/src/utils/notification-archive-storage";
import { toLocalDateKey } from "@/src/features/notifications/utils";
import type { NotificationFilter } from "@/src/features/notifications/types";

type FeedResponse<T> = {
  date?: string;
  notifications?: T[];
};

type Params<T extends NotificationArchiveBaseItem> = {
  audience: NotificationAudience;
  token: string | null;
  userId?: string;
  fetchFeed: (token: string, date: string) => Promise<FeedResponse<T>>;
};

export const useNotificationsFeed = <T extends NotificationArchiveBaseItem>({
  audience,
  token,
  userId,
  fetchFeed,
}: Params<T>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [archivedItems, setArchivedItems] = useState<
    ArchivedNotificationItem<T>[]
  >([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");

  const todayDateKey = useMemo(() => toLocalDateKey(), []);

  const loadNotifications = useCallback(
    async (asPullRefresh = false) => {
      if (!token) {
        setError("You need to sign in first.");
        setItems([]);
        return;
      }

      if (asPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const result = await fetchFeed(token, todayDateKey);
        setItems(result.notifications || []);
        setDate(result.date || todayDateKey);
      } catch (loadError: any) {
        setError(loadError?.message || "Failed to load notifications.");
        setItems([]);
      } finally {
        if (asPullRefresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [fetchFeed, todayDateKey, token],
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let isMounted = true;

    const restoreArchiveState = async () => {
      if (!userId) {
        if (isMounted) {
          setReadIds({});
          setArchivedItems([]);
          setStorageReady(false);
        }
        return;
      }

      const storedState = await loadNotificationArchiveState<T>({
        audience,
        userId,
      });

      if (!isMounted) {
        return;
      }

      setReadIds(storedState.readIds);
      setArchivedItems(storedState.archivedItems);
      setStorageReady(true);
    };

    void restoreArchiveState();

    return () => {
      isMounted = false;
    };
  }, [audience, userId]);

  useEffect(() => {
    if (!storageReady || !userId) {
      return;
    }

    void saveNotificationArchiveState<T>({
      audience,
      userId,
      state: {
        readIds,
        archivedItems,
      },
    });
  }, [archivedItems, audience, readIds, storageReady, userId]);

  const archivedIdSet = useMemo(
    () => new Set(archivedItems.map((item) => item.id)),
    [archivedItems],
  );

  const activeItems = useMemo(
    () => items.filter((item) => !archivedIdSet.has(item.id)),
    [archivedIdSet, items],
  );

  const markAsRead = (id: string) => {
    setReadIds((current) => ({ ...current, [id]: true }));
  };

  const markAllAsRead = () => {
    const nextRead: Record<string, boolean> = { ...readIds };
    activeItems.forEach((item) => {
      nextRead[item.id] = true;
    });
    setReadIds(nextRead);
  };

  const archiveNotification = (item: T) => {
    setReadIds((current) => ({ ...current, [item.id]: true }));
    setArchivedItems((current) => {
      if (current.some((entry) => entry.id === item.id)) {
        return current;
      }

      return [
        {
          ...item,
          archivedAt: new Date().toISOString(),
          sourceDate: date || todayDateKey,
        },
        ...current,
      ].slice(0, 200);
    });
  };

  const restoreNotification = (id: string) => {
    setArchivedItems((current) => current.filter((item) => item.id !== id));
  };

  const deleteArchivedNotification = (id: string) => {
    setArchivedItems((current) => current.filter((item) => item.id !== id));
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const deleteAllArchivedNotifications = () => {
    const deletedIds = new Set(archivedItems.map((item) => item.id));
    setArchivedItems([]);
    setItems((current) => current.filter((item) => !deletedIds.has(item.id)));
  };

  const unreadCount = useMemo(() => activeItems.filter((item) => !readIds[item.id]).length,
    [activeItems, readIds],
  );

  const visibleActiveItems = useMemo(() => {
    if (activeFilter === "unread") {
      return activeItems.filter((item) => !readIds[item.id]);
    }
    return activeItems;
  }, [activeFilter, activeItems, readIds]);

  const showEmptyState =
    !isLoading &&
    !error &&
    ((activeFilter === "archived" && archivedItems.length === 0) ||
      (activeFilter !== "archived" && visibleActiveItems.length === 0));

  return {
    date,
    isLoading,
    isRefreshing,
    error,
    readIds,
    activeItems,
    archivedItems,
    visibleActiveItems,
    unreadCount,
    activeFilter,
    setActiveFilter,
    showEmptyState,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    restoreNotification,
    deleteArchivedNotification,
    deleteAllArchivedNotifications,
    loadNotifications,
  };
};

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadNotificationArchiveState, saveNotificationArchiveState, type NotificationArchiveBaseItem,
  type ArchivedNotificationItem,
  type NotificationAudience,
} from "@/src/utils/notification-archive-storage";
import { addDaysToDateKey, toLocalDateKey } from "@/src/features/notifications/utils";
import type { NotificationFilter } from "@/src/features/notifications/types";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import { readOfflineResource, onlineWithOfflineFallback } from "@/src/offline/offline-read";

type FeedResponse<T> = {
  date?: string;
  notifications?: T[];
};

type Params<T extends NotificationArchiveBaseItem> = {
  audience: NotificationAudience;
  userId?: string;
  fetchFeed: (date: string) => Promise<FeedResponse<T>>;
};

export const useNotificationsFeed = <T extends NotificationArchiveBaseItem>({
  audience,
  userId,
  fetchFeed,
}: Params<T>) => {
  const { isAuthenticated } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [archivedItems, setArchivedItems] = useState<ArchivedNotificationItem<T>[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeFilter, setActiveFilterState] = useState<NotificationFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const todayDateKey = useMemo(() => toLocalDateKey(), []);
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);

  const { data, isLoading, isRefetching, error: queryError, refetch } = useQuery({
    queryKey: mobileQueryKeys.notificationsFeed(audience, userId, selectedDateKey),
    enabled: isAuthenticated,
    queryFn: async () => {
      return onlineWithOfflineFallback(
        isOffline,
        async () => {
          const result = await fetchFeed(selectedDateKey);
          return { items: result.notifications || [], date: result.date || selectedDateKey };
        },
        async () => {
          if (!userId) return { items: [], date: selectedDateKey };
          const items = await readOfflineResource<(T & { feedDate?: string })>(userId, "notifications");
          const matchingItems = items.filter((item) => !item.feedDate || item.feedDate === selectedDateKey);
          return { items: matchingItems, date: selectedDateKey };
        },
      );
    },
    networkMode: "always",
  });

  const items = useMemo(() => data?.items || [], [data?.items]);
  const date = data?.date || null;
  const error = !isAuthenticated
    ? "You need to sign in first."
    : queryError instanceof Error ? queryError.message
    : queryError ? "Failed to load notifications." : null;

  const loadNotifications = useCallback(async () => { await refetch(); }, [refetch]);
  const changeDate = (days: number) => {
    setSelectedIds([]);
    setSelectedDateKey((current) => {
      const next = addDaysToDateKey(current, days);
      return next > todayDateKey ? todayDateKey : next;
    });
  };

  useEffect(() => {
    let isMounted = true;
    const restoreArchiveState = async () => {
      if (!userId) {
        if (isMounted) { setReadIds({}); setArchivedItems([]); setDeletedIds([]); setStorageReady(false); }
        return;
      }
      const storedState = await loadNotificationArchiveState<T>({ audience, userId });
      if (!isMounted) return;
      setReadIds(storedState.readIds);
      setArchivedItems(storedState.archivedItems);
      setDeletedIds(storedState.deletedIds);
      setStorageReady(true);
    };
    void restoreArchiveState();
    return () => { isMounted = false; };
  }, [audience, userId]);

  useEffect(() => {
    if (!storageReady || !userId) return;
    void saveNotificationArchiveState<T>({ audience, userId, state: { readIds, archivedItems, deletedIds } });
  }, [archivedItems, audience, deletedIds, readIds, storageReady, userId]);

  const archivedIdSet = useMemo(() => new Set(archivedItems.map((item) => item.id)), [archivedItems]);
  const deletedIdSet = useMemo(() => new Set(deletedIds), [deletedIds]);
  const activeItems = useMemo(() => items.filter((item) => !archivedIdSet.has(item.id) && !deletedIdSet.has(item.id)), [archivedIdSet, deletedIdSet, items]);

  const markAsRead = (id: string) => { setReadIds((current) => ({ ...current, [id]: true })); };
  const markAllAsRead = () => {
    const nextRead: Record<string, boolean> = { ...readIds };
    activeItems.forEach((item) => { nextRead[item.id] = true; });
    setReadIds(nextRead);
  };

  const archiveNotification = (item: T) => {
    setReadIds((current) => ({ ...current, [item.id]: true }));
    setArchivedItems((current) => {
      if (current.some((entry) => entry.id === item.id)) return current;
      return [{ ...item, archivedAt: new Date().toISOString(), sourceDate: date || todayDateKey }, ...current].slice(0, 200);
    });
  };

  const restoreNotification = (id: string) => { setArchivedItems((current) => current.filter((item) => item.id !== id)); };
  const deleteArchivedNotification = (id: string) => {
    setArchivedItems((current) => current.filter((item) => item.id !== id));
    setDeletedIds((current) => current.includes(id) ? current : [...current, id]);
  };
  const unreadCount = useMemo(() => activeItems.filter((item) => !readIds[item.id]).length, [activeItems, readIds]);
  const visibleActiveItems = useMemo(() => {
    if (activeFilter === "unread") return activeItems.filter((item) => !readIds[item.id]);
    return activeItems;
  }, [activeFilter, activeItems, readIds]);
  const selectableItems = activeFilter === "archived" ? archivedItems : visibleActiveItems;
  const selectableIds = useMemo(
    () => selectableItems.map((item) => item.id),
    [selectableItems],
  );
  const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };
  const selectAll = () => {
    setSelectedIds(selectableIds);
  };
  const clearSelection = () => {
    setSelectedIds([]);
  };
  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : selectableIds);
  };
  const archiveSelectedNotifications = () => {
    const selected = new Set(selectedIds);
    const itemsToArchive = visibleActiveItems.filter((item) => selected.has(item.id));
    if (!itemsToArchive.length) return;
    setReadIds((current) => {
      const next = { ...current };
      itemsToArchive.forEach((item) => { next[item.id] = true; });
      return next;
    });
    setArchivedItems((current) => {
      const existing = new Set(current.map((item) => item.id));
      const archivedAt = new Date().toISOString();
      const additions = itemsToArchive
        .filter((item) => !existing.has(item.id))
        .map((item) => ({ ...item, archivedAt, sourceDate: date || selectedDateKey }));
      return [...additions, ...current].slice(0, 200);
    });
    setSelectedIds([]);
  };
  const restoreSelectedNotifications = () => {
    const selected = new Set(selectedIds);
    setArchivedItems((current) => current.filter((item) => !selected.has(item.id)));
    setSelectedIds([]);
  };
  const deleteSelectedNotifications = () => {
    const selected = new Set(selectedIds);
    setArchivedItems((current) => current.filter((item) => !selected.has(item.id)));
    setDeletedIds((current) => Array.from(new Set([...current, ...selectedIds])));
    setReadIds((current) => {
      const next = { ...current };
      selectedIds.forEach((id) => { delete next[id]; });
      return next;
    });
    setSelectedIds([]);
  };
  const setActiveFilter = (value: NotificationFilter) => {
    setSelectedIds([]);
    setActiveFilterState(value);
  };

  const showEmptyState = !isLoading && !error &&
    ((activeFilter === "archived" && archivedItems.length === 0) ||
     (activeFilter !== "archived" && visibleActiveItems.length === 0));

  return {
    date, isLoading, isRefreshing: isRefetching, error, readIds,
    canGoToNextDate: selectedDateKey < todayDateKey,
    goToPreviousDate: () => changeDate(-1),
    goToNextDate: () => changeDate(1),
    activeItems, archivedItems, visibleActiveItems, unreadCount,
    selectedIds, allVisibleSelected, toggleSelected, toggleSelectAll,
    selectAll, clearSelection,
    archiveSelectedNotifications, restoreSelectedNotifications,
    deleteSelectedNotifications,
    activeFilter, setActiveFilter, showEmptyState, markAsRead, markAllAsRead,
    archiveNotification, restoreNotification, deleteArchivedNotification,
    loadNotifications,
  };
};

import { useState } from "react";
import { useRouter, type Href } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { View } from "react-native";
import type {
  ArchivedItem,
  CardUI,
  NotificationFilter,
  NotificationItemBase,
} from "@/src/features/notifications/types";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  RefreshableScrollView,
} from "@/src/components/ui";
import type { ScreenHeaderBackgroundVariant } from "@/src/components/ui";
import { useSafeBack } from "@/src/hooks/use-safe-back";
import {
  NotificationDateStrip,
  NotificationFilterTabs,
  NotificationBulkBar,
  NotificationEmptyState,
  NotificationErrorCard,
  NotificationFeedCard,
  NotificationArchivedCard,
} from "@/src/features/notifications/components";

export type { NotificationItemBase, ArchivedItem, CardUI };

type Props<T extends NotificationItemBase> = {
  fallbackRoute: Href;
  subtitle: string;
  headerBackgroundVariant?: ScreenHeaderBackgroundVariant;
  date: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  readIds: Record<string, boolean>;
  activeItems: T[];
  archivedItems: ArchivedItem<T>[];
  visibleActiveItems: T[];
  unreadCount: number;
  selectedIds: string[];
  allVisibleSelected: boolean;
  activeFilter: NotificationFilter;
  setActiveFilter: (value: NotificationFilter) => void;
  showEmptyState: boolean;
  onRefresh: () => void;
  canGoToNextDate: boolean;
  goToPreviousDate: () => void;
  goToNextDate: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (item: T) => void;
  restoreNotification: (id: string) => void;
  deleteArchivedNotification: (id: string) => void;
  toggleSelected: (id: string) => void;
  toggleSelectAll: () => void;
  selectAll?: () => void;
  clearSelection?: () => void;
  archiveSelectedNotifications: () => void;
  restoreSelectedNotifications: () => void;
  deleteSelectedNotifications: () => void;
  cardUi: Record<string, CardUI>;
  resolveTitle?: (item: T, fallbackTitle: string) => string;
};

const defaultResolveTitle = <T extends NotificationItemBase>(
  item: T,
  fallbackTitle: string,
) => item.title || fallbackTitle;

const fallbackUi: CardUI = {
  fallbackTitle: "Notification",
  icon: AlertCircle,
  iconColor: "#0F766E",
  iconBg: "#CCFBF1",
  accent: "#0F766E",
};

export function NotificationFeedScreen<T extends NotificationItemBase>({
  fallbackRoute,
  subtitle,
  headerBackgroundVariant = "solid",
  date,
  isLoading,
  isRefreshing,
  error,
  readIds,
  activeItems,
  archivedItems,
  visibleActiveItems,
  unreadCount,
  selectedIds,
  activeFilter,
  setActiveFilter,
  showEmptyState,
  onRefresh,
  canGoToNextDate,
  goToPreviousDate,
  goToNextDate,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  restoreNotification,
  deleteArchivedNotification,
  toggleSelected,
  toggleSelectAll,
  selectAll,
  clearSelection,
  archiveSelectedNotifications,
  restoreSelectedNotifications,
  deleteSelectedNotifications,
  cardUi,
  resolveTitle = defaultResolveTitle,
}: Props<T>) {
  const handleBack = useSafeBack(fallbackRoute);
  const router = useRouter();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const selectableCount =
    activeFilter === "archived" ? archivedItems.length : visibleActiveItems.length;
  const isInSelectionMode = isSelectMode || selectedIds.length > 0;

  const handleSelectAll = () => {
    if (selectAll) {
      selectAll();
    } else {
      toggleSelectAll();
    }
  };

  const handleClear = () => {
    if (clearSelection) {
      clearSelection();
    } else {
      toggleSelectAll();
    }
  };

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    handleClear();
  };

  if (isLoading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant={headerBackgroundVariant}
          title="Notifications"
          subtitle={subtitle}
          onBack={handleBack}
        />
        <ScreenLoadingState
          title="Loading notifications"
          message="Getting your latest alerts and reminders ready."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant={headerBackgroundVariant}
        title="Notifications"
        subtitle={subtitle}
        onBack={handleBack}
      />

      <RefreshableScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        refreshColor="#0D9488"
      >
        {/* Date navigation strip */}
        <NotificationDateStrip
          date={date}
          canGoToNextDate={canGoToNextDate}
          goToPreviousDate={goToPreviousDate}
          goToNextDate={goToNextDate}
          activeCount={activeItems.length}
          archivedCount={archivedItems.length}
        />

        {/* Filter bar and bulk actions */}
        <View className="mt-4">
          <NotificationFilterTabs
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            allCount={activeItems.length}
            unreadCount={unreadCount}
            archivedCount={archivedItems.length}
          />

          <NotificationBulkBar
            activeFilter={activeFilter}
            selectableCount={selectableCount}
            selectedCount={selectedIds.length}
            isInSelectionMode={isInSelectionMode}
            unreadCount={unreadCount}
            onEnterSelectMode={() => setIsSelectMode(true)}
            onExitSelectMode={handleExitSelectMode}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClear}
            onArchiveSelected={archiveSelectedNotifications}
            onRestoreSelected={restoreSelectedNotifications}
            onDeleteSelected={deleteSelectedNotifications}
            onMarkAllAsRead={markAllAsRead}
          />
        </View>

        {/* Error state */}
        {!isLoading && error ? (
          <NotificationErrorCard error={error} onRetry={onRefresh} />
        ) : null}

        {/* Empty state */}
        {showEmptyState ? (
          <NotificationEmptyState activeFilter={activeFilter} />
        ) : null}

        {/* Active notification cards */}
        {!isLoading &&
        !error &&
        activeFilter !== "archived" &&
        visibleActiveItems.length > 0 ? (
          <View className="mt-4">
            {visibleActiveItems.map((item) => {
              const ui = cardUi[item.type] ?? fallbackUi;
              const isRead = Boolean(readIds[item.id]);
              const isSelected = selectedIds.includes(item.id);
              const title = resolveTitle(item, ui.fallbackTitle);

              return (
                <NotificationFeedCard<T>
                  key={item.id}
                  item={item}
                  ui={ui}
                  title={title}
                  isRead={isRead}
                  isSelected={isSelected}
                  isInSelectionMode={isInSelectionMode}
                  onPress={() => {
                    if (isInSelectionMode) {
                      toggleSelected(item.id);
                    } else {
                      markAsRead(item.id);
                    }
                  }}
                  onLongPress={() => {
                    if (!isInSelectionMode) {
                      setIsSelectMode(true);
                      toggleSelected(item.id);
                    }
                  }}
                  onToggleSelect={() => toggleSelected(item.id)}
                  onActionPress={
                    item.actionPath
                      ? () => {
                          markAsRead(item.id);
                          router.push(item.actionPath as Href);
                        }
                      : undefined
                  }
                  onArchive={() => archiveNotification(item)}
                />
              );
            })}
          </View>
        ) : null}

        {/* Archived notification cards */}
        {!isLoading &&
        !error &&
        activeFilter === "archived" &&
        archivedItems.length > 0 ? (
          <View className="mt-4">
            {archivedItems.map((item) => {
              const ui = cardUi[item.type] ?? fallbackUi;
              const isSelected = selectedIds.includes(item.id);
              const title = resolveTitle(item, ui.fallbackTitle);

              return (
                <NotificationArchivedCard<T>
                  key={item.id}
                  item={item}
                  ui={ui}
                  title={title}
                  isSelected={isSelected}
                  isInSelectionMode={isInSelectionMode}
                  onPress={() => {
                    if (isInSelectionMode) {
                      toggleSelected(item.id);
                    }
                  }}
                  onLongPress={() => {
                    if (!isInSelectionMode) {
                      setIsSelectMode(true);
                      toggleSelected(item.id);
                    }
                  }}
                  onToggleSelect={() => toggleSelected(item.id)}
                  onRestore={() => restoreNotification(item.id)}
                  onDelete={() => deleteArchivedNotification(item.id)}
                />
              );
            })}
          </View>
        ) : null}
      </RefreshableScrollView>
    </ScreenShell>
  );
}

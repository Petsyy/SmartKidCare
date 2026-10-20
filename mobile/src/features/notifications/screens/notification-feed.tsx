import { useState, type ComponentType } from "react";
import { useRouter, type Href } from "expo-router";
import { AlertCircle, Archive, Bell, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Trash2 } from "lucide-react-native";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import type { NotificationFilter } from "@/src/features/notifications/types";
import {
  formatArchivedAt,
  formatDateLabel,
} from "@/src/features/notifications/utils";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  RefreshableScrollView,
} from "@/src/components/ui";
import type { ScreenHeaderBackgroundVariant } from "@/src/components/ui";
import { useSafeBack } from "@/src/hooks/use-safe-back";
import { NotificationCheckbox } from "@/src/features/notifications/components/notification-checkbox";

type NotificationItemBase = {
  id: string;
  type: string;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
  actionPath?: string;
};

type ArchivedItem<T extends NotificationItemBase> = T & {
  archivedAt: string;
  sourceDate: string;
};

type CardUI = {
  fallbackTitle: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  accent: string;
};

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
  allVisibleSelected,
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

  const fallbackUi: CardUI = {
    fallbackTitle: "Notification",
    icon: AlertCircle,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
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
        {/* ── Summary strip ──────────────────────────────────────── */}
        <View className="rounded-2xl bg-teal-50 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show previous day's notifications"
              onPress={goToPreviousDate}
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
            >
              <ChevronLeft size={20} color="#0F766E" />
            </Pressable>
            <Text className="text-base font-bold text-gray-900">
              {date ? formatDateLabel(date) : "Today"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show next day's notifications"
              accessibilityState={{ disabled: !canGoToNextDate }}
              disabled={!canGoToNextDate}
              onPress={goToNextDate}
              className={`h-10 w-10 items-center justify-center rounded-full bg-white ${canGoToNextDate ? "opacity-100" : "opacity-40"}`}
            >
              <ChevronRight size={20} color="#0F766E" />
            </Pressable>
          </View>
          <View className="mt-2 flex-row items-center justify-center gap-2">
              <View className="rounded-full bg-teal-100 px-3 py-1">
                <Text className="text-xs font-bold text-teal-800">
                  {activeItems.length} active
                </Text>
              </View>
              {archivedItems.length > 0 ? (
                <View className="rounded-full bg-gray-200 px-3 py-1">
                  <Text className="text-xs font-semibold text-gray-600">
                    {archivedItems.length} archived
                  </Text>
                </View>
              ) : null}
          </View>
        </View>

        {/* ── Filter bar ─────────────────────────────────────────── */}
        <View className="mt-4">
          <View className="flex-row rounded-2xl bg-gray-100 p-1">
            <Pressable
              onPress={() => setActiveFilter("all")}
              className={`flex-1 items-center rounded-xl py-2.5 ${
                activeFilter === "all" ? "bg-teal-600" : "bg-transparent"
              }`}
              style={
                activeFilter === "all"
                  ? {
                      shadowColor: "#0F766E",
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-bold ${
                  activeFilter === "all" ? "text-white" : "text-gray-500"
                }`}
              >
                All ({activeItems.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter("unread")}
              className={`flex-1 items-center rounded-xl py-2.5 ${
                activeFilter === "unread" ? "bg-teal-600" : "bg-transparent"
              }`}
              style={
                activeFilter === "unread"
                  ? {
                      shadowColor: "#0F766E",
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-bold ${
                  activeFilter === "unread" ? "text-white" : "text-gray-500"
                }`}
              >
                Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter("archived")}
              className={`flex-1 items-center rounded-xl py-2.5 ${
                activeFilter === "archived" ? "bg-teal-600" : "bg-transparent"
              }`}
              style={
                activeFilter === "archived"
                  ? {
                      shadowColor: "#0F766E",
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-bold ${
                  activeFilter === "archived" ? "text-white" : "text-gray-500"
                }`}
              >
                Archived
                {archivedItems.length > 0
                  ? ` (${archivedItems.length})`
                  : ""}
              </Text>
            </Pressable>
          </View>

          {/* Bulk action row matching pickup screen flow */}
          {selectableCount > 0 ? (
            <View
              className="mt-3 rounded-2xl border border-gray-200 bg-white p-4"
              style={{
                shadowColor: "#0D9488",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-lg font-black text-gray-900">
                    {activeFilter === "archived" ? "Archived items" : "Notification actions"}
                  </Text>
                  <Text className="mt-1 text-sm font-semibold leading-5 text-gray-500">
                    {isInSelectionMode
                      ? `${selectedIds.length} of ${selectableCount} items selected`
                      : activeFilter === "archived"
                        ? "Select items to restore or permanently delete."
                        : "Select items to archive at once."}
                  </Text>
                </View>

                {!isInSelectionMode ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Enable selection mode"
                    onPress={() => setIsSelectMode(true)}
                    className="min-h-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-600 px-4 active:bg-teal-100"
                  >
                    <Text className="text-sm font-bold text-teal-700">Select</Text>
                  </Pressable>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <View className="rounded-full bg-teal-600 px-3 py-1">
                      <Text className="text-xs font-bold text-white">
                        {selectedIds.length} selected
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Exit selection mode"
                      onPress={handleExitSelectMode}
                      className="min-h-9 items-center justify-center rounded-xl bg-gray-100 px-3 active:bg-gray-200"
                    >
                      <Text className="text-xs font-bold text-gray-700">Cancel</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {isInSelectionMode ? (
                <View className="mt-3 flex-row items-center gap-2.5">
                  {selectedIds.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear selection"
                      onPress={handleClear}
                      className="min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 active:bg-gray-100"
                    >
                      <Text className="text-sm font-bold text-gray-700">Clear</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Select all visible notifications"
                      onPress={handleSelectAll}
                      className="min-h-11 items-center justify-center rounded-xl border border-teal-600 bg-teal-50 px-4 active:bg-teal-100"
                    >
                      <Text className="text-sm font-bold text-teal-700">Select All</Text>
                    </Pressable>
                  )}

                  {activeFilter === "archived" ? (
                    <View className="flex-1 flex-row gap-2">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Restore selected notifications"
                        disabled={selectedIds.length === 0}
                        onPress={restoreSelectedNotifications}
                        className={`min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 ${
                          selectedIds.length === 0
                            ? "border-gray-200 bg-gray-100 opacity-60"
                            : "border-teal-200 bg-teal-50 active:bg-teal-100"
                        }`}
                      >
                        <RotateCcw size={15} color={selectedIds.length === 0 ? "#9CA3AF" : "#0F766E"} strokeWidth={2} />
                        <Text className={`text-sm font-bold ${selectedIds.length === 0 ? "text-gray-400" : "text-teal-700"}`}>
                          Restore
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete selected notifications"
                        disabled={selectedIds.length === 0}
                        onPress={() => Alert.alert(
                          "Delete Selected Notifications",
                          `Permanently delete ${selectedIds.length} selected notification${selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: deleteSelectedNotifications },
                          ],
                        )}
                        className={`min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 ${
                          selectedIds.length === 0
                            ? "border-gray-200 bg-gray-100 opacity-60"
                            : "border-rose-200 bg-rose-50 active:bg-rose-100"
                        }`}
                      >
                        <Trash2 size={15} color={selectedIds.length === 0 ? "#9CA3AF" : "#BE123C"} strokeWidth={2} />
                        <Text className={`text-sm font-bold ${selectedIds.length === 0 ? "text-gray-400" : "text-rose-700"}`}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Archive selected notifications"
                      disabled={selectedIds.length === 0}
                      onPress={archiveSelectedNotifications}
                      className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-4 ${
                        selectedIds.length === 0
                          ? "bg-gray-200"
                          : "bg-teal-600 active:bg-teal-700"
                      }`}
                    >
                      <Archive size={16} color={selectedIds.length === 0 ? "#9CA3AF" : "#FFFFFF"} strokeWidth={2} />
                      <Text className={`text-sm font-bold ${selectedIds.length === 0 ? "text-gray-400" : "text-white"}`}>
                        Archive {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : activeFilter !== "archived" && unreadCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                  onPress={markAllAsRead}
                  className="mt-3 min-h-10 items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100"
                >
                  <Text className="text-sm font-bold text-teal-700">Mark all as read</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Error state ────────────────────────────────────────── */}
        {!isLoading && error ? (
          <View className="mt-4 flex-row items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
              <AlertCircle size={20} color="#BE123C" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-rose-800">
                Something went wrong
              </Text>
              <Text className="mt-1 text-sm leading-5 text-rose-700">
                {error}
              </Text>
              <Pressable
                onPress={onRefresh}
                className="mt-3 self-start rounded-full bg-rose-600 px-4 py-2"
              >
                <Text className="text-xs font-bold text-white">Try again</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ── Empty state ────────────────────────────────────────── */}
        {showEmptyState ? (
          <View className="mt-6 items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  activeFilter === "unread"
                    ? "#D1FAE5"
                    : activeFilter === "archived"
                      ? "#F3F4F6"
                      : "#CCFBF1",
              }}
            >
              {activeFilter === "unread" ? (
                <CheckCircle2 size={28} color="#059669" strokeWidth={1.5} />
              ) : activeFilter === "archived" ? (
                <Archive size={28} color="#6B7280" strokeWidth={1.5} />
              ) : (
                <Bell size={28} color="#0F766E" strokeWidth={1.5} />
              )}
            </View>
            <Text className="text-center text-base font-bold text-gray-700">
              {activeFilter === "unread"
                ? "Everything's read"
                : activeFilter === "archived"
                  ? "No archived items"
                  : "All caught up!"}
            </Text>
            <Text className="mt-1.5 text-center text-sm leading-5 text-gray-400">
              {activeFilter === "unread"
                ? "You've read all your notifications. Nice work!"
                : activeFilter === "archived"
                  ? "Notifications you archive will appear here for reference."
                  : "No notifications for this date. We'll let you know when something needs your attention."}
            </Text>
          </View>
        ) : null}

        {/* ── Active notification cards ──────────────────────────── */}
        {!isLoading &&
        !error &&
        activeFilter !== "archived" &&
        visibleActiveItems.length > 0 ? (
          <View className="mt-4">
            {visibleActiveItems.map((item) => {
              const ui = cardUi[item.type] ?? fallbackUi;
              const Icon = ui.icon;
              const isRead = Boolean(readIds[item.id]);
              return (
                <Pressable
                  key={item.id}
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
                  className={`mb-3 overflow-hidden rounded-2xl p-4 active:scale-[0.99] ${
                    selectedIds.includes(item.id)
                      ? "border border-teal-500 bg-teal-50/70"
                      : isRead
                        ? "border border-transparent bg-white"
                        : "border border-teal-200 bg-white"
                  }`}
                  style={{
                    shadowColor: "#0F172A",
                    shadowOpacity: selectedIds.includes(item.id) ? 0.08 : isRead ? 0.03 : 0.06,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: isRead ? 1 : 2,
                  }}
                >
                  <View className="flex-row items-center">
                    {isInSelectionMode ? (
                      <NotificationCheckbox
                        selected={selectedIds.includes(item.id)}
                        label={`Select ${resolveTitle(item, ui.fallbackTitle)}`}
                        onPress={() => toggleSelected(item.id)}
                        className="mr-3"
                      />
                    ) : null}

                    {/* Icon */}
                    <View
                      className="mr-3 h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: ui.iconBg }}
                    >
                      <Icon
                        size={22}
                        color={ui.iconColor}
                        strokeWidth={1.5}
                      />
                    </View>

                    {/* Content Header info */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        {!isRead ? (
                          <View className="h-2 w-2 rounded-full bg-teal-500" />
                        ) : null}
                        <Text
                          className={`flex-1 text-base font-extrabold ${
                            isRead ? "text-gray-700" : "text-gray-900"
                          }`}
                          numberOfLines={1}
                        >
                          {resolveTitle(item, ui.fallbackTitle)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Body Content */}
                  <View className={isInSelectionMode ? "pl-11" : "pl-15"}>
                    <Text
                      className={`mt-2 text-sm leading-5 ${
                        isRead ? "text-gray-400" : "text-gray-600"
                      }`}
                      numberOfLines={3}
                    >
                      {item.message}
                    </Text>

                    {/* Footer: time + actions */}
                    <View className="mt-3 flex-row items-center justify-between">
                      {item.timeLabel ? (
                        <View
                          className="rounded-full px-3 py-1"
                          style={{ backgroundColor: ui.iconBg }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: ui.iconColor }}
                          >
                            {item.timeLabel}
                          </Text>
                        </View>
                      ) : (
                        <View />
                      )}

                      <View className="flex-row items-center gap-2">
                        {item.actionPath ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={item.actionLabel}
                            onPress={(event) => {
                              event.stopPropagation();
                              markAsRead(item.id);
                              router.push(item.actionPath as Href);
                            }}
                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5"
                            style={{ minHeight: 32 }}
                          >
                            <Text className="text-xs font-bold text-amber-700">
                              {item.actionLabel}
                            </Text>
                          </Pressable>
                        ) : null}
                        {!isInSelectionMode ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Archive ${resolveTitle(item, ui.fallbackTitle)}`}
                            onPress={(event) => {
                              event.stopPropagation();
                              archiveNotification(item);
                            }}
                            className="flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5"
                            style={{ minHeight: 32 }}
                          >
                            <Archive size={13} color="#6B7280" strokeWidth={2} />
                            <Text className="text-xs font-semibold text-gray-600">
                              Archive
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* ── Archived notification cards ─────────────────────────── */}
        {!isLoading &&
        !error &&
        activeFilter === "archived" &&
        archivedItems.length > 0 ? (
          <View className="mt-4">
            {archivedItems.map((item) => {
              const ui = cardUi[item.type] ?? fallbackUi;
              const Icon = ui.icon;
              return (
                <Pressable
                  key={item.id}
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
                  className={`mb-3 overflow-hidden rounded-2xl p-4 active:scale-[0.99] ${
                    selectedIds.includes(item.id)
                      ? "border border-teal-500 bg-teal-50/70"
                      : "border border-transparent bg-white"
                  }`}
                  style={{
                    shadowColor: "#0F172A",
                    shadowOpacity: selectedIds.includes(item.id) ? 0.08 : 0.03,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 1,
                  }}
                >
                  <View className="flex-row items-center">
                    {isInSelectionMode ? (
                      <NotificationCheckbox
                        selected={selectedIds.includes(item.id)}
                        label={`Select ${resolveTitle(item, ui.fallbackTitle)}`}
                        onPress={() => toggleSelected(item.id)}
                        className="mr-3"
                      />
                    ) : null}
                    {/* Icon */}
                    <View
                      className="mr-3 h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: ui.iconBg,
                        opacity: 0.8,
                      }}
                    >
                      <Icon
                        size={22}
                        color={ui.iconColor}
                        strokeWidth={1.5}
                      />
                    </View>

                    {/* Content Header */}
                    <View className="flex-1">
                      <Text
                        className="text-base font-extrabold text-gray-800"
                        numberOfLines={1}
                      >
                        {resolveTitle(item, ui.fallbackTitle)}
                      </Text>
                    </View>
                  </View>

                  {/* Body Content */}
                  <View className={isInSelectionMode ? "pl-11" : "pl-15"}>
                    <Text
                      className="mt-2 text-sm leading-5 text-gray-500"
                      numberOfLines={3}
                    >
                      {item.message}
                    </Text>

                    {/* Source date badge */}
                    <View className="mt-3 flex-row items-center">
                      <View className="rounded-full bg-gray-100 px-3 py-1">
                        <Text className="text-xs font-semibold text-gray-500">
                          {item.sourceDate
                            ? formatDateLabel(item.sourceDate)
                            : item.timeLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Footer: archived timestamp + actions */}
                    <View className="mt-3 flex-row items-center justify-between pt-1">
                      <Text className="text-xs text-gray-400">
                        {formatArchivedAt(item.archivedAt)}
                      </Text>

                      {!isInSelectionMode ? (
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => restoreNotification(item.id)}
                            className="flex-row items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5"
                            style={{ minHeight: 32 }}
                          >
                            <RotateCcw
                              size={13}
                              color="#0F766E"
                              strokeWidth={2}
                            />
                            <Text className="text-xs font-semibold text-teal-700">
                              Restore
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              Alert.alert(
                                "Delete Notification",
                                "Are you sure you want to permanently delete this archived notification? This action cannot be undone.",
                                [
                                  {
                                    text: "Cancel",
                                    onPress: () => {},
                                    style: "cancel",
                                  },
                                  {
                                    text: "Delete",
                                    onPress: () =>
                                      deleteArchivedNotification(item.id),
                                    style: "destructive",
                                  },
                                ],
                              );
                            }}
                            className="flex-row items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5"
                            style={{ minHeight: 32 }}
                          >
                            <Trash2
                              size={13}
                              color="#BE123C"
                              strokeWidth={2}
                            />
                            <Text className="text-xs font-semibold text-rose-700">
                              Delete
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </RefreshableScrollView>
    </ScreenShell>
  );
}

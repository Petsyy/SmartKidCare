import type { ComponentType } from "react";
import { AlertCircle, Archive, Bell, CheckCircle2, RotateCcw, Trash2 } from "lucide-react-native";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
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
} from "@/src/components/ui";
import type { ScreenHeaderBackgroundVariant } from "@/src/components/ui";

type NotificationItemBase = {
  id: string;
  type: string;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
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
  activeFilter: NotificationFilter;
  setActiveFilter: (value: NotificationFilter) => void;
  showEmptyState: boolean;
  onRefresh: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (item: T) => void;
  restoreNotification: (id: string) => void;
  deleteArchivedNotification: (id: string) => void;
  deleteAllArchivedNotifications: () => void;
  cardUi: Record<string, CardUI>;
  resolveTitle?: (item: T, fallbackTitle: string) => string;
};

const defaultResolveTitle = <T extends NotificationItemBase>(
  item: T,
  fallbackTitle: string,
) => item.title || fallbackTitle;

export function NotificationFeedScreen<T extends NotificationItemBase>({
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
  activeFilter,
  setActiveFilter,
  showEmptyState,
  onRefresh,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  restoreNotification,
  deleteArchivedNotification,
  deleteAllArchivedNotifications,
  cardUi,
  resolveTitle = defaultResolveTitle,
}: Props<T>) {
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
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#0D9488"]}
            tintColor="#0D9488"
          />
        }
      >
        {/* ── Summary strip ──────────────────────────────────────── */}
        <View className="rounded-2xl bg-teal-50 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-gray-900">
              {date ? formatDateLabel(date) : "Today"}
            </Text>
            <View className="flex-row items-center gap-2">
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

          {/* Bulk action row */}
          <View className="mt-3 flex-row items-center justify-end">
            {activeFilter === "archived" && archivedItems.length > 0 ? (
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Clear All Archived",
                    "This will permanently delete all archived notifications. This action cannot be undone.",
                    [
                      { text: "Cancel", onPress: () => {}, style: "cancel" },
                      {
                        text: "Delete",
                        onPress: () => deleteAllArchivedNotifications(),
                        style: "destructive",
                      },
                    ],
                  );
                }}
                className="flex-row items-center gap-1.5 rounded-full bg-rose-50 px-4 py-2"
              >
                <Trash2 size={14} color="#BE123C" strokeWidth={2} />
                <Text className="text-xs font-bold text-rose-700">
                  Clear all
                </Text>
              </Pressable>
            ) : null}
            {activeFilter !== "archived" && unreadCount > 0 ? (
              <Pressable
                onPress={markAllAsRead}
                className="flex-row items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2"
              >
                <CheckCircle2 size={14} color="#0F766E" strokeWidth={2} />
                <Text className="text-xs font-bold text-teal-700">
                  Mark all read
                </Text>
              </Pressable>
            ) : null}
          </View>
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
                  : "No notifications for today. We'll let you know when something needs your attention."}
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
                  onPress={() => markAsRead(item.id)}
                  className={`mb-3 rounded-2xl border p-4 ${
                    isRead
                      ? "border-gray-100 bg-white"
                      : "border-teal-200 bg-white"
                  }`}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: isRead ? "#D1D5DB" : ui.accent,
                    shadowColor: "#0F766E",
                    shadowOpacity: isRead ? 0.03 : 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: isRead ? 1 : 2,
                  }}
                >
                  <View className="flex-row items-start">
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

                    {/* Content */}
                    <View className="flex-1">
                      {/* Title row with unread dot */}
                      <View className="flex-row items-center gap-2">
                        {!isRead ? (
                          <View className="h-2 w-2 rounded-full bg-teal-500" />
                        ) : null}
                        <Text
                          className={`flex-1 text-base font-bold ${
                            isRead ? "text-gray-600" : "text-gray-900"
                          }`}
                          numberOfLines={2}
                        >
                          {resolveTitle(item, ui.fallbackTitle)}
                        </Text>
                      </View>

                      {/* Message */}
                      <Text
                        className={`mt-2 text-sm leading-5 ${
                          isRead ? "text-gray-400" : "text-gray-600"
                        }`}
                        numberOfLines={3}
                      >
                        {item.message}
                      </Text>

                      {/* Footer: time + archive action */}
                      <View className="mt-3 flex-row items-center justify-between">
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

                        <Pressable
                          onPress={() => archiveNotification(item)}
                          className="flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-2"
                          style={{ minHeight: 36 }}
                        >
                          <Archive
                            size={14}
                            color="#6B7280"
                            strokeWidth={2}
                          />
                          <Text className="text-xs font-semibold text-gray-600">
                            Archive
                          </Text>
                        </Pressable>
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
                <View
                  key={item.id}
                  className="mb-3 rounded-2xl border border-gray-100 bg-white p-4"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: "#D1D5DB",
                    shadowColor: "#6B7280",
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 1,
                  }}
                >
                  <View className="flex-row items-start">
                    {/* Icon */}
                    <View
                      className="mr-3 h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: ui.iconBg,
                        opacity: 0.6,
                      }}
                    >
                      <Icon
                        size={22}
                        color={ui.iconColor}
                        strokeWidth={1.5}
                      />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold text-gray-600"
                        numberOfLines={2}
                      >
                        {resolveTitle(item, ui.fallbackTitle)}
                      </Text>

                      <Text
                        className="mt-2 text-sm leading-5 text-gray-400"
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
                      <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                        <Text className="text-xs text-gray-400">
                          {formatArchivedAt(item.archivedAt)}
                        </Text>

                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => restoreNotification(item.id)}
                            className="flex-row items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-2"
                            style={{ minHeight: 36 }}
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
                            className="flex-row items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2"
                            style={{ minHeight: 36 }}
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
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

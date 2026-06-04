import type { ComponentType } from "react";
import { AlertCircle } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { NotificationFilter } from "@/src/features/notifications/types";
import { formatArchivedAt, formatDateLabel } from "@/src/features/notifications/utils";

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
  const insets = useSafeAreaInsets();
  const fallbackUi: CardUI = {
    fallbackTitle: "Notification",
    icon: AlertCircle,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={{ paddingTop: insets.top + 12 }} className="bg-teal-600 px-5 pb-5">
        <Text className="text-3xl font-extrabold text-white">Notifications</Text>
        <Text className="mt-1 text-lg text-teal-100">{subtitle}</Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 24, flexGrow: 1 }}
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
        <View className="rounded-3xl border border-teal-100 bg-white p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-bold text-gray-900">
                {date ? `Today (${formatDateLabel(date)})` : "Today"}
              </Text>
              <Text className="mt-1 text-sm text-gray-500">Alerts and updates for today</Text>
            </View>
            <View className="rounded-full bg-teal-50 px-3 py-1.5">
              <Text className="text-xs font-semibold text-teal-700">{activeItems.length} active</Text>
            </View>
          </View>

          <Text className="mt-2 text-xs text-gray-500">{archivedItems.length} archived</Text>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row rounded-full bg-gray-100 p-1">
              <Pressable
                onPress={() => setActiveFilter("all")}
                className={`mr-1 rounded-full px-3 py-2 ${activeFilter === "all" ? "bg-teal-600" : "bg-transparent"}`}
              >
                <Text className={`text-sm font-semibold ${activeFilter === "all" ? "text-white" : "text-gray-600"}`}>
                  All
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter("unread")}
                className={`mr-1 rounded-full px-3 py-2 ${activeFilter === "unread" ? "bg-teal-600" : "bg-transparent"}`}
              >
                <Text className={`text-sm font-semibold ${activeFilter === "unread" ? "text-white" : "text-gray-600"}`}>
                  Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter("archived")}
                className={`rounded-full px-3 py-2 ${activeFilter === "archived" ? "bg-teal-600" : "bg-transparent"}`}
              >
                <Text className={`text-sm font-semibold ${activeFilter === "archived" ? "text-white" : "text-gray-600"}`}>
                  Archived {archivedItems.length > 0 ? `(${archivedItems.length})` : ""}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-3">
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
                      ]
                    );
                  }}
                  className="rounded-full bg-rose-50 px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-rose-700">Clear all</Text>
                </Pressable>
              ) : null}
              {activeFilter !== "archived" && activeItems.length > 0 ? (
                <Pressable onPress={markAllAsRead}>
                  <Text className="text-sm font-semibold text-teal-700">Mark all read</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {isLoading ? (
            <View className="mt-4 flex-row items-center">
              <ActivityIndicator size="small" color="#0D9488" />
              <Text className="ml-2 text-base text-gray-600">Loading notifications...</Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <Text className="text-sm font-semibold text-rose-700">ERROR</Text>
              <Text className="mt-1 text-base text-rose-800">{error}</Text>
            </View>
          ) : null}

          {showEmptyState ? (
            <View className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <Text className="text-base text-gray-600">
                {activeFilter === "unread"
                  ? "No unread notifications."
                  : activeFilter === "archived"
                    ? "No archived notifications yet."
                    : "No notifications for today."}
              </Text>
            </View>
          ) : null}

          {!isLoading && !error && activeFilter !== "archived" && visibleActiveItems.length > 0 ? (
            <View className="mt-4">
              {visibleActiveItems.map((item, index) => {
                const ui = cardUi[item.type] ?? fallbackUi;
                const Icon = ui.icon;
                const isRead = Boolean(readIds[item.id]);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    className={`mb-3 rounded-2xl border p-5 ${
                      isRead ? "border-gray-200 bg-white" : "border-teal-200 bg-white"
                    }`}
                    style={{
                      borderLeftWidth: 5,
                      borderLeftColor: ui.accent,
                      shadowColor: "#0F766E",
                      shadowOpacity: isRead ? 0.05 : 0.12,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: isRead ? 1 : 3,
                      opacity: isRead ? 0.82 : 1,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0" style={{ backgroundColor: ui.iconBg }}>
                        <Icon size={24} color={ui.iconColor} strokeWidth={1.5} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-lg font-bold text-gray-900">
                                {resolveTitle(item, ui.fallbackTitle)}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-xs text-gray-400">{index + 1} of {visibleActiveItems.length}</Text>
                        </View>

                        <Text className="mt-3 text-base leading-6 text-gray-700">{item.message}</Text>

                        <View className="mt-3 flex-row items-center justify-between">
                          <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: ui.iconBg }}>
                            <Text className="text-xs font-semibold" style={{ color: ui.iconColor }}>
                              {item.timeLabel}
                            </Text>
                          </View>

                          <Pressable onPress={() => archiveNotification(item)} className="rounded-full border border-gray-200 px-3 py-1.5">
                            <Text className="text-xs font-semibold text-gray-700">Archive</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {!isLoading && !error && activeFilter === "archived" && archivedItems.length > 0 ? (
            <View className="mt-4">
              {archivedItems.map((item, index) => {
                const ui = cardUi[item.type] ?? fallbackUi;
                const Icon = ui.icon;
                return (
                  <View
                    key={item.id}
                    className="mb-3 rounded-2xl border border-gray-200 bg-white p-5"
                    style={{
                      borderLeftWidth: 5,
                      borderLeftColor: ui.accent,
                      shadowColor: "#0F766E",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 1,
                      opacity: 0.92,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0" style={{ backgroundColor: ui.iconBg }}>
                        <Icon size={24} color={ui.iconColor} strokeWidth={1.5} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-start justify-between gap-2">
                          <Text className="flex-1 text-lg font-bold text-gray-900">
                            {resolveTitle(item, ui.fallbackTitle)}
                          </Text>
                          <Text className="text-xs text-gray-400">{index + 1} of {archivedItems.length}</Text>
                        </View>

                        <Text className="mt-3 text-base leading-6 text-gray-700">{item.message}</Text>

                        <View className="mt-3 flex-row items-center justify-between">
                          <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: ui.iconBg }}>
                            <Text className="text-xs font-semibold" style={{ color: ui.iconColor }}>
                              {item.sourceDate ? formatDateLabel(item.sourceDate) : item.timeLabel}
                            </Text>
                          </View>

                          <View className="flex-row gap-2">
                            <Pressable onPress={() => restoreNotification(item.id)} className="rounded-full border border-teal-200 px-3 py-1.5">
                              <Text className="text-xs font-semibold text-teal-700">Restore</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Alert.alert(
                                  "Delete Notification",
                                  "Are you sure you want to permanently delete this archived notification? This action cannot be undone.",
                                  [
                                    { text: "Cancel", onPress: () => {}, style: "cancel" },
                                    {
                                      text: "Delete",
                                      onPress: () => deleteArchivedNotification(item.id),
                                      style: "destructive",
                                    },
                                  ]
                                );
                              }}
                              className="rounded-full border border-rose-200 px-3 py-1.5"
                            >
                              <Text className="text-xs font-semibold text-rose-700">Delete</Text>
                            </Pressable>
                          </View>
                        </View>

                        <Text className="mt-2 text-xs text-gray-400">{formatArchivedAt(item.archivedAt)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

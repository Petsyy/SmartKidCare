import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "@/src/hooks/use-auth";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LucideIcon,
  UtensilsCrossed,
} from "lucide-react-native";
import {
  getTeacherNotificationsFeed,
  TeacherNotificationFeedItem,
} from "@/src/api/notifications.api";
import {
  ArchivedNotificationItem,
  loadNotificationArchiveState,
  saveNotificationArchiveState,
} from "@/src/utils/notification-archive-storage";

type TeacherArchivedNotification = ArchivedNotificationItem<TeacherNotificationFeedItem>;

const toLocalDateKey = (value: Date = new Date()): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (value: string): string => {
  const [year, month, day] = value.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  return utcDate.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
};

const formatArchivedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Archived";
  }
  return `Archived ${date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })}`;
};

const TYPE_UI: Record<
  TeacherNotificationFeedItem["type"],
  {
    fallbackTitle: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    accent: string;
  }
> = {
  attendance_reminder: {
    fallbackTitle: "Morning Attendance",
    icon: Clock3,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  attendance_incomplete: {
    fallbackTitle: "Attendance Incomplete",
    icon: AlertCircle,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#0F766E",
  },
  feeding_reminder: {
    fallbackTitle: "Lunch Feeding",
    icon: Clock3,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  feeding_incomplete: {
    fallbackTitle: "Feeding Incomplete",
    icon: UtensilsCrossed,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#0F766E",
  },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [items, setItems] = useState<TeacherNotificationFeedItem[]>([]);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [archivedItems, setArchivedItems] = useState<TeacherArchivedNotification[]>(
    [],
  );
  const [storageReady, setStorageReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "archived">(
    "all",
  );

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
        const result = await getTeacherNotificationsFeed(token, {
          date: todayDateKey,
        });
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
    [token, todayDateKey],
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let isMounted = true;

    const restoreArchiveState = async () => {
      if (!user?.id) {
        if (isMounted) {
          setReadIds({});
          setArchivedItems([]);
          setStorageReady(false);
        }
        return;
      }

      const storedState = await loadNotificationArchiveState<TeacherNotificationFeedItem>(
        {
          audience: "teacher",
          userId: user.id,
        },
      );

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
  }, [user?.id]);

  useEffect(() => {
    if (!storageReady || !user?.id) {
      return;
    }

    void saveNotificationArchiveState<TeacherNotificationFeedItem>({
      audience: "teacher",
      userId: user.id,
      state: {
        readIds,
        archivedItems,
      },
    });
  }, [archivedItems, readIds, storageReady, user?.id]);

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

  const archiveNotification = (item: TeacherNotificationFeedItem) => {
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

  const unreadCount = useMemo(() => {
    return activeItems.filter((item) => !readIds[item.id]).length;
  }, [activeItems, readIds]);

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <Text className="text-3xl font-extrabold text-white">
          Notifications
        </Text>
        <Text className="mt-1 text-lg text-teal-100">
          Teacher alerts and reminders
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadNotifications(true)}
            colors={["#0D9488"]}
            tintColor="#0D9488"
          />
        }
      >
        <View className="rounded-2xl border border-teal-100 bg-white p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-semibold text-gray-800">
                {date ? `Today (${formatDateLabel(date)})` : "Today"}
              </Text>
              <Text className="mt-1 text-xs text-gray-500">
                {activeItems.length} active, {archivedItems.length} archived
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row">
              <Pressable
                onPress={() => setActiveFilter("all")}
                className={`mr-2 rounded-full px-3 py-2 ${
                  activeFilter === "all" ? "bg-teal-600" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeFilter === "all" ? "text-white" : "text-gray-600"
                  }`}
                >
                  All
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter("unread")}
                className={`mr-2 rounded-full px-3 py-2 ${
                  activeFilter === "unread" ? "bg-teal-600" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeFilter === "unread" ? "text-white" : "text-gray-600"
                  }`}
                >
                  Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter("archived")}
                className={`rounded-full px-3 py-2 ${
                  activeFilter === "archived" ? "bg-teal-600" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeFilter === "archived"
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  Archived {archivedItems.length > 0 ? `(${archivedItems.length})` : ""}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={markAllAsRead}
              disabled={activeItems.length === 0 || activeFilter === "archived"}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeItems.length === 0 || activeFilter === "archived"
                    ? "text-gray-300"
                    : "text-teal-700"
                }`}
              >
                Mark all read
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="mt-4 flex-row items-center">
              <ActivityIndicator size="small" color="#0D9488" />
              <Text className="ml-2 text-base text-gray-600">
                Loading notifications...
              </Text>
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
              {visibleActiveItems.map((item) => {
                const ui = TYPE_UI[item.type];
                const Icon = ui.icon;
                const isRead = readIds[item.id];

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    className={`mb-3 rounded-2xl border p-5 transition-all ${
                      isRead
                        ? "border-gray-200 bg-white"
                        : "border-teal-200 bg-white"
                    }`}
                    style={{
                      borderLeftWidth: 5,
                      borderLeftColor: ui.accent,
                      shadowColor: "#14B8A6",
                      shadowOpacity: isRead ? 0.05 : 0.12,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: isRead ? 1 : 3,
                      opacity: isRead ? 0.85 : 1,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        className="mr-4 h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0"
                        style={{ backgroundColor: ui.iconBg }}
                      >
                        <Icon
                          size={24}
                          color={ui.iconColor}
                          strokeWidth={1.5}
                        />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-lg font-bold text-gray-900">
                                {item.title === "Reminder"
                                  ? ui.fallbackTitle
                                  : item.title}
                              </Text>
                              {!isRead && (
                                <View
                                  className="h-2 w-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: ui.accent }}
                                />
                              )}
                            </View>
                          </View>
                          {!isRead ? (
                            <View
                              className="mt-1.5 h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ui.accent }}
                            />
                          ) : (
                            <CheckCircle2
                              size={18}
                              color="#16A34A"
                              strokeWidth={1.5}
                            />
                          )}
                        </View>

                        <Text className="mt-3 text-base leading-6 text-gray-700">
                          {item.message}
                        </Text>

                        <View className="mt-3 flex-row items-center justify-between gap-2">
                          <View
                            className="rounded-full px-3 py-1.5 flex-row items-center gap-1"
                            style={{
                              backgroundColor: ui.iconBg,
                            }}
                          >
                            <Icon size={12} color={ui.iconColor} />
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: ui.iconColor }}
                            >
                              {item.timeLabel}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => archiveNotification(item)}
                            className="rounded-full border border-gray-200 px-3 py-1.5"
                          >
                            <Text className="text-xs font-semibold text-gray-700">
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

          {!isLoading && !error && activeFilter === "archived" && archivedItems.length > 0 ? (
            <View className="mt-4">
              {archivedItems.map((item, index) => {
                const ui = TYPE_UI[item.type];
                const Icon = ui.icon;

                return (
                  <View
                    key={item.id}
                    className="mb-3 rounded-2xl border border-gray-200 bg-white p-5"
                    style={{
                      borderLeftWidth: 5,
                      borderLeftColor: ui.accent,
                      shadowColor: "#14B8A6",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 1,
                      opacity: 0.92,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        className="mr-4 h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0"
                        style={{ backgroundColor: ui.iconBg }}
                      >
                        <Icon size={24} color={ui.iconColor} strokeWidth={1.5} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-start justify-between gap-2">
                          <Text className="flex-1 text-lg font-bold text-gray-900">
                            {item.title === "Reminder"
                              ? ui.fallbackTitle
                              : item.title}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            {index + 1} of {archivedItems.length}
                          </Text>
                        </View>

                        <Text className="mt-3 text-base leading-6 text-gray-700">
                          {item.message}
                        </Text>

                        <View className="mt-3 flex-row items-center justify-between gap-2">
                          <View
                            className="rounded-full px-3 py-1.5 flex-row items-center gap-1"
                            style={{
                              backgroundColor: ui.iconBg,
                            }}
                          >
                            <Icon size={12} color={ui.iconColor} />
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: ui.iconColor }}
                            >
                              {item.sourceDate ? formatDateLabel(item.sourceDate) : item.timeLabel}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => restoreNotification(item.id)}
                            className="rounded-full border border-teal-200 px-3 py-1.5"
                          >
                            <Text className="text-xs font-semibold text-teal-700">
                              Restore
                            </Text>
                          </Pressable>
                        </View>

                        <Text className="mt-2 text-xs text-gray-400">
                          {formatArchivedAt(item.archivedAt)}
                        </Text>
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

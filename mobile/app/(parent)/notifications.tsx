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
import { useAuth } from "@/src/hooks/useAuth";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  LucideIcon,
  UtensilsCrossed,
} from "lucide-react-native";
import {
  getParentNotificationsFeed,
  ParentNotificationFeedItem,
} from "@/src/api/notifications.api";

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

const TYPE_UI: Record<
  ParentNotificationFeedItem["type"],
  {
    fallbackTitle: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    accent: string;
  }
> = {
  attendance_submitted: {
    fallbackTitle: "Attendance Submitted",
    icon: ClipboardCheck,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  absence_alert: {
    fallbackTitle: "Absence Alert",
    icon: AlertCircle,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#B45309",
  },
  feeding_submitted: {
    fallbackTitle: "Feeding Submitted",
    icon: UtensilsCrossed,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  missed_meal_alert: {
    fallbackTitle: "Missed Meal Alert",
    icon: AlertCircle,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#B45309",
  },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [items, setItems] = useState<ParentNotificationFeedItem[]>([]);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

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
        const result = await getParentNotificationsFeed(token, {
          date: todayDateKey,
        });
        const incomingItems = result.notifications || [];
        setItems(incomingItems);
        setDate(result.date || todayDateKey);
        setReadIds((current) => {
          const nextRead: Record<string, boolean> = {};
          incomingItems.forEach((item) => {
            if (current[item.id]) {
              nextRead[item.id] = true;
            }
          });
          return nextRead;
        });
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

  const markAsRead = (id: string) => {
    setReadIds((current) => ({ ...current, [id]: true }));
  };

  const markAllAsRead = () => {
    const nextRead: Record<string, boolean> = {};
    items.forEach((item) => {
      nextRead[item.id] = true;
    });
    setReadIds(nextRead);
  };

  const unreadCount = useMemo(() => {
    return items.filter((item) => !readIds[item.id]).length;
  }, [items, readIds]);

  const visibleItems = useMemo(() => {
    if (activeFilter === "unread") {
      return items.filter((item) => !readIds[item.id]);
    }
    return items;
  }, [activeFilter, items, readIds]);

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
          Parent alerts and updates
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
        <View className="rounded-3xl border border-teal-100 bg-white p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-bold text-gray-900">
                {date ? `Today (${formatDateLabel(date)})` : "Today"}
              </Text>
              <Text className="mt-1 text-sm text-gray-500">
                Parent alerts for today
              </Text>
            </View>
            <View className="rounded-full bg-teal-50 px-3 py-1.5">
              <Text className="text-xs font-semibold text-teal-700">
                {items.length}{" "}
                {items.length === 1 ? "notification" : "notifications"}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row rounded-full bg-gray-100 p-1">
              <Pressable
                onPress={() => setActiveFilter("all")}
                className={`mr-1 rounded-full px-4 py-2 ${
                  activeFilter === "all" ? "bg-teal-600" : "bg-transparent"
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
                className={`rounded-full px-4 py-2 ${
                  activeFilter === "unread" ? "bg-teal-600" : "bg-transparent"
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
            </View>

            <Pressable onPress={markAllAsRead} disabled={items.length === 0}>
              <Text
                className={`text-sm font-semibold ${
                  items.length === 0 ? "text-gray-300" : "text-teal-700"
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

          {!isLoading && !error && visibleItems.length === 0 ? (
            <View className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <Text className="text-base text-gray-600">
                {activeFilter === "unread"
                  ? "No unread notifications."
                  : "No notifications for today."}
              </Text>
            </View>
          ) : null}

          {!isLoading && !error && visibleItems.length > 0 ? (
            <View className="mt-4">
              {visibleItems.map((item) => {
                const ui = TYPE_UI[item.type];
                const Icon = ui.icon;
                const isRead = Boolean(readIds[item.id]);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    className={`mb-3 rounded-2xl border p-4 ${
                      isRead
                        ? "border-gray-200 bg-white"
                        : "border-teal-100 bg-teal-50"
                    }`}
                    style={{
                      borderLeftWidth: 5,
                      borderLeftColor: ui.accent,
                      shadowColor: "#0F766E",
                      shadowOpacity: isRead ? 0.04 : 0.1,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                        style={{ backgroundColor: ui.iconBg }}
                      >
                        <Icon size={22} color={ui.iconColor} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <Text className="text-xl font-extrabold text-gray-900">
                              {item.title || ui.fallbackTitle}
                            </Text>
                          </View>
                          {!isRead ? (
                            <View className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-600" />
                          ) : (
                            <CheckCircle2 size={16} color="#16A34A" />
                          )}
                        </View>

                        <Text className="mt-2 text-base leading-6 text-gray-800">
                          {item.message}
                        </Text>

                        <View className="mt-3 flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-gray-500">
                            {item.timeLabel}
                          </Text>
                          <Text
                            className={`text-xs font-semibold ${
                              isRead ? "text-emerald-600" : "text-teal-700"
                            }`}
                          >
                            {isRead ? "Read" : "Unread"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

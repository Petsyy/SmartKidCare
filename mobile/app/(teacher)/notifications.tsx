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
  Clock3,
  LucideIcon,
  UtensilsCrossed,
} from "lucide-react-native";
import {
  getTeacherNotificationsFeed,
  TeacherNotificationFeedItem,
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
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [items, setItems] = useState<TeacherNotificationFeedItem[]>([]);
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
        const result = await getTeacherNotificationsFeed(token, {
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
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row">
              <Pressable
                onPress={() => setActiveFilter("all")}
                className={`mr-2 rounded-full px-4 py-2 ${
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
                className={`rounded-full px-4 py-2 ${
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

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    className={`mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 ${
                      readIds[item.id] ? "opacity-55" : "opacity-100"
                    }`}
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: ui.accent,
                    }}
                  >
                    <View className="flex-row">
                      <View
                        className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                        style={{ backgroundColor: ui.iconBg }}
                      >
                        <Icon size={20} color={ui.iconColor} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xl font-bold text-gray-800">
                            {item.title === "Reminder"
                              ? ui.fallbackTitle
                              : item.title}
                          </Text>
                          {!readIds[item.id] ? (
                            <View className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                          ) : (
                            <CheckCircle2 size={16} color="#16A34A" />
                          )}
                        </View>

                        <Text className="mt-1 text-lg text-gray-600">
                          {item.message}
                        </Text>

                        <Text className="mt-2 text-base text-gray-500">
                          {formatDateLabel(date || todayDateKey)} -{" "}
                          {item.timeLabel}
                        </Text>
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

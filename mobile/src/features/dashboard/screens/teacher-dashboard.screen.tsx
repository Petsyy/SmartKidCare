import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Bell,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  House,
  UserCheck,
  UserX,
  Users,
  Utensils,
  UtensilsCrossed,
  Zap,
} from "lucide-react-native";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { StatCard, ActionCard, NoticeItem } from "../components";
import type { TeacherNotificationFeedItem } from "@/src/api/notifications.api";

const NOTICE_TYPE_UI: Record<
  TeacherNotificationFeedItem["type"],
  {
    fallbackTitle: string;
    tone: "emerald" | "blue" | "orange";
  }
> = {
  attendance_reminder: {
    fallbackTitle: "Morning Attendance",
    tone: "emerald",
  },
  attendance_incomplete: {
    fallbackTitle: "Attendance Incomplete",
    tone: "orange",
  },
  feeding_reminder: {
    fallbackTitle: "Lunch Feeding",
    tone: "blue",
  },
  feeding_incomplete: {
    fallbackTitle: "Feeding Incomplete",
    tone: "orange",
  },
};

const Icons = {
  Bell,
  Calendar,
  Home: House,
  Users,
  UserCheck,
  UserX,
  UtensilsCrossed,
  Zap,
  ClipboardCheck,
  Utensils,
  ChevronRight,
};

export default function TeacherDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dashboardData = useTeacherDashboard();

  const {
    loading,
    refreshing,
    teacherName,
    totalChildren,
    presentToday,
    absentToday,
    feedingDone,
    recentNotifications,
    onRefresh,
  } = dashboardData;

  const centerName = "Child Development Center";

  // Dynamic date
  const currentDate = new Date();
  const dateParts = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).formatToParts(currentDate);

  const weekday =
    dateParts.find((part) => part.type === "weekday")?.value ?? "";
  const month = dateParts.find((part) => part.type === "month")?.value ?? "";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "";
  const year = dateParts.find((part) => part.type === "year")?.value ?? "";

  const dateLabel = `${weekday} ${month}, ${day} ${year}`.trim();

  const scrollBottomPadding = useMemo(
    () => Math.max(120, insets.bottom + 88),
    [insets.bottom]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-5"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-3xl font-extrabold text-white">
                Dashboard
              </Text>
              <Text className="text-lg text-teal-100 mt-1">
                Loading your overview...
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(teacher)/notifications")}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/20"
            >
              <Icons.Bell size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="mt-4 text-base text-gray-600 font-medium">
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-3xl font-extrabold text-white">
              Today's Overview, {teacherName}
            </Text>
            <Text className="text-lg text-teal-100 mt-1">
              Here's your dashboard for today
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(teacher)/notifications")}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/20"
          >
            <Icons.Bell size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: scrollBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14B8A6"
            colors={["#14B8A6"]}
          />
        }
      >
        <View className="mb-5 rounded-3xl bg-teal-600 p-5 shadow-md">
          <View className="flex-row items-start">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <Icons.Calendar size={24} color="#14B8A6" />
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-base font-bold text-white">
                {dateLabel}
              </Text>

              <View className="mt-2 flex-row items-center">
                <Icons.Home size={18} color="white" />
                <Text className="ml-2 text-sm text-teal-50">{centerName}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6 flex-row gap-4">
          <View className="flex-1">
            <StatCard
              title="Total Children"
              value={totalChildren}
              icon={<Icons.Users size={24} color="#0284C7" />}
              variant="blue"
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Present Today"
              value={presentToday}
              icon={<Icons.UserCheck size={24} color="#059669" />}
              variant="green"
            />
          </View>
        </View>

        <View className="mb-7 flex-row gap-4">
          <View className="flex-1">
            <StatCard
              title="Absent Today"
              value={absentToday}
              icon={<Icons.UserX size={24} color="#C2410C" />}
              variant="amber"
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Feeding Done"
              value={feedingDone}
              icon={<Icons.UtensilsCrossed size={24} color="#059669" />}
              variant="green"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-7 rounded-3xl bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
              <Icons.Zap size={20} color="#14B8A6" />
            </View>
            <Text className="ml-3 text-xl font-bold text-gray-900">
              Quick Actions
            </Text>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <ActionCard
                title="Record Attendance"
                subtitle=""
                icon={<Icons.ClipboardCheck size={24} color="#14B8A6" />}
                onPress={() =>
                  router.push("/(teacher)/teacher-record-data/attendance")
                }
              />
            </View>

            <View className="flex-1">
              <ActionCard
                title="Record Feeding"
                subtitle=""
                icon={<Icons.Utensils size={24} color="#14B8A6" />}
                onPress={() =>
                  router.push("/(teacher)/teacher-record-data/feeding")
                }
              />
            </View>
          </View>
        </View>

        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              Recent Notifications
            </Text>

            <Pressable
              className="flex-row items-center"
              onPress={() => router.push("/(teacher)/notifications")}
            >
              <Text className="text-base font-semibold text-teal-600">
                View all
              </Text>
              <Icons.ChevronRight size={18} color="#14B8A6" />
            </Pressable>
          </View>

          {recentNotifications.length > 0 ? (
            recentNotifications.slice(0, 3).map((item, index) => {
              const ui = NOTICE_TYPE_UI[item.type];
              const title =
                item.title === "Reminder" ? ui.fallbackTitle : item.title;
              const visibleCount = Math.min(recentNotifications.length, 3);

              return (
                <React.Fragment key={item.id}>
                  <NoticeItem
                    title={title}
                    desc={item.message}
                    meta={item.timeLabel}
                    tone={ui.tone}
                    onPress={() => router.push("/(teacher)/notifications")}
                  />
                  {index < visibleCount - 1 ? <View className="h-3" /> : null}
                </React.Fragment>
              );
            })
          ) : (
            <View className="rounded-2xl bg-gray-50 p-4">
              <Text className="text-sm font-medium text-gray-600">
                No recent notifications for today.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

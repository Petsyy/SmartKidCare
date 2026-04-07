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
  Calendar,
  ChevronRight,
  ClipboardCheck,
  House,
  MessageCircle,
  UserCheck,
  UserX,
  Users,
  Utensils,
  UtensilsCrossed,
  Zap,
} from "lucide-react-native";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { StatCard, ActionCard } from "../components";
import { StatRow, ProgressBar } from "@/src/components/dashboard-overview";

const Icons = {
  Users,
  Calendar,
  Home: House,
  UserCheck,
  UserX,
  UtensilsCrossed,
  Zap,
  ClipboardCheck,
  Utensils,
  ChevronRight,
  MessageCircle,
};

export default function ParentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dashboardData = useParentDashboard();

  const {
    selectedChild,
    recentNotifications,
    stats,
    presentToday,
    absentToday,
    feedingDoneToday,
    loading,
    refreshing,
    error,
    children,
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

  const childFullName = useMemo(() => {
    if (!selectedChild) return "";
    const middle = selectedChild.middleName
      ? ` ${selectedChild.middleName}`
      : "";
    return `${selectedChild.firstName}${middle} ${selectedChild.lastName}`
      .replace(/\s+/g, " ")
      .trim();
  }, [selectedChild]);

  const initials = useMemo(() => {
    if (!selectedChild) return "";
    const a = selectedChild.firstName.charAt(0) ?? "";
    const b = selectedChild.lastName.charAt(0) ?? "";
    return (a + b).toUpperCase() || "-";
  }, [selectedChild]);

  const childAge = selectedChild?.age ?? "-";
  const childGender = selectedChild?.gender ? selectedChild.gender : "-";
  const enrolledText = selectedChild?.enrollmentDate
    ? (() => {
        const parts = new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Manila",
        }).formatToParts(new Date(selectedChild.enrollmentDate));

        const month = parts.find((part) => part.type === "month")?.value ?? "";
        const day = parts.find((part) => part.type === "day")?.value ?? "";
        const year = parts.find((part) => part.type === "year")?.value ?? "";

        return `${month}, ${day} ${year}`.trim();
      })()
    : "-";

  const totalChildren = useMemo(() => children.length, [children.length]);

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
          <Text className="text-3xl font-extrabold text-white">Dashboard</Text>
          <Text className="text-lg text-teal-100 mt-1">
            Loading your overview...
          </Text>
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

  if (error || !selectedChild) {
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
          <Text className="text-3xl font-extrabold text-white">Dashboard</Text>
          <Text className="text-lg text-teal-100 mt-1">Parent Overview</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Icons.Users size={64} color="#D1D5DB" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            {error || "No Children Linked"}
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            {error
              ? "Please try again or contact support."
              : "No children are linked to your account yet."}
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
        <Text className="text-3xl font-extrabold text-white">
          Today&apos;s Overview
        </Text>
        <Text className="text-lg text-teal-100 mt-1">
          Here&apos;s your child&apos;s dashboard
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 100,
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
        {/* Date & Center Card */}
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

        {/* Child Info Card */}
        <View className="mb-6 rounded-3xl bg-teal-600 p-5 shadow-md">
          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mr-4">
              <Text className="text-teal-600 text-2xl font-bold">
                {initials}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                {childFullName}
              </Text>
              <Text className="text-base text-teal-100 mt-1">
                {childAge} years old • {String(childGender).toLowerCase()}
              </Text>

              <View className="flex-row items-center mt-1">
                <Icons.Calendar size={16} color="white" />
                <Text className="text-sm text-teal-50 ml-2">
                  Enrolled: {enrolledText}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
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
              value={feedingDoneToday}
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
                title="View Attendance"
                subtitle=""
                icon={<Icons.ClipboardCheck size={24} color="#14B8A6" />}
                onPress={() => router.push("./parent-view-record/attendance")}
              />
            </View>

            <View className="flex-1">
              <ActionCard
                title="View Feeding"
                subtitle=""
                icon={<Icons.Utensils size={24} color="#14B8A6" />}
                onPress={() => router.push("./parent-view-record/feeding")}
              />
            </View>
          </View>
        </View>

        {/* Attendance & Feeding Breakdown */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          {/* Attendance Section */}
          <View className="flex-row items-center mb-3">
            <Icons.Calendar size={20} color="#10B981" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Attendance Breakdown
            </Text>
          </View>
          <StatRow
            color="#22C55E"
            label="Present"
            value={`${stats.present} days`}
          />
          <StatRow
            color="#9CA3AF"
            label="Absent"
            value={`${stats.absent} days`}
          />

          {/* Divider */}
          <View className="my-5 h-px bg-gray-200" />

          {/* Feeding Section */}
          <View className="flex-row items-center mb-3">
            <Icons.Utensils size={20} color="#10B981" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Feeding Overview
            </Text>
          </View>
          <StatRow
            color="#22C55E"
            label="Meals Completed"
            value={`${stats.mealsCompleted} days`}
          />
          <StatRow
            color="#9CA3AF"
            label="Meals Missed"
            value={`${stats.mealsMissed} days`}
          />

          <View className="mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Completion Rate</Text>
              <Text className="text-teal-600 font-semibold">
                {stats.mealsCompleted + stats.mealsMissed > 0
                  ? Math.round(
                      (stats.mealsCompleted /
                        (stats.mealsCompleted + stats.mealsMissed)) *
                        100
                    )
                  : 0}
                %
              </Text>
            </View>
            <View className="mt-2">
              <ProgressBar
                percent={
                  stats.mealsCompleted + stats.mealsMissed > 0
                    ? Math.round(
                        (stats.mealsCompleted /
                          (stats.mealsCompleted + stats.mealsMissed)) *
                          100
                      )
                    : 0
                }
              />
            </View>
          </View>
        </View>

        {/* Recent Activity (Notifications) */}
        <View className="rounded-3xl bg-white mt-6 p-5 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              Recent Updates
            </Text>

            <Pressable
              className="flex-row items-center"
              onPress={() => router.push("/(parent)/notifications")}
            >
              <Text className="text-base font-semibold text-teal-600">
                View all
              </Text>
              <Icons.ChevronRight size={18} color="#14B8A6" />
            </Pressable>
          </View>

          {recentNotifications.length === 0 ? (
            <View className="rounded-2xl bg-gray-50 p-4">
              <Text className="text-sm text-gray-600">
                No notifications yet for today.
              </Text>
            </View>
          ) : (
            recentNotifications.map((item, index) => (
              <View
                key={item.id}
                className={`rounded-2xl bg-gray-50 p-4 ${index > 0 ? "mt-3" : ""}`}
              >
                <View className="flex-row">
                  <View className="mr-4 w-1.5 rounded-full bg-emerald-600" />
                  <View className="flex-1">
                    <Text className="text-base font-extrabold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-gray-600">
                      {item.message}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-400">
                      {item.timeLabel}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating AI Chat button */}
      <Pressable
        onPress={() => router.push("/(parent)/chat")}
        className="absolute right-5 rounded-full bg-teal-600 p-4 active:opacity-90"
        style={{
          bottom: 24 + insets.bottom + 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Icons.MessageCircle size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

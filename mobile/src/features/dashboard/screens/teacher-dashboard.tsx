import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  School,
  UserCheck,
  Users,
  UserX,
  Utensils,
} from "lucide-react-native";
import type { TeacherNotificationFeedItem } from "@/src/api/notifications.api";
import {
  ScreenLoadingState,
  ScreenShell,
  TEACHER_HEADER_GRADIENT,
} from "@/src/components/ui";
import { useSystemSettings } from "@/src/context/system-settings-context";
import { NoticeItem, TeacherOverviewStatCard } from "../components";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";

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
    attendance_submitted: {
        fallbackTitle: "",
        tone: "emerald"
    },
    feeding_submitted: {
        fallbackTitle: "",
        tone: "emerald"
    }
};

export default function TeacherDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    loading,
    refreshing,
    error,
    teacherName,
    totalChildren,
    presentToday,
    absentToday,
    feedingDone,
    feedingMissed,
    attendanceData,
    feedingData,
    recentNotifications,
    onRefresh,
  } = useTeacherDashboard();
  const { settings, loading: settingsLoading } = useSystemSettings();

  const centerName = settingsLoading
    ? "Loading center..."
    : settings?.schoolName || "Smart KidCare";
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      }).format(new Date()),
    [],
  );
  const scrollBottomPadding = useMemo(
    () => Math.max(120, insets.bottom + 88),
    [insets.bottom],
  );

  const hasChildren = totalChildren > 0;
  const attendanceSubmitted = Boolean(attendanceData);
  const attendanceAvailable = hasChildren && attendanceSubmitted;
  const feedingSubmitted = Boolean(feedingData);
  const feedingNotRequired = attendanceSubmitted && presentToday === 0;
  const feedingActionEnabled =
    hasChildren &&
    (feedingSubmitted || (attendanceSubmitted && !feedingNotRequired));
  const mealsCompletedValue = !hasChildren
    ? "--"
    : feedingSubmitted
      ? feedingDone
      : feedingNotRequired
        ? "N/A"
        : "--";
  const mealsCompletedCaption = !hasChildren
    ? "No children assigned"
    : feedingSubmitted
      ? `${feedingMissed} missed`
      : feedingNotRequired
        ? "Not needed today"
        : "Awaiting meal record";

  const allDailyTasksDone =
    attendanceSubmitted && (feedingSubmitted || feedingNotRequired);

  const actionableNotifications = useMemo(() => {
    return recentNotifications.filter((item) => {
      if (
        (item.type === "attendance_reminder" ||
          item.type === "attendance_incomplete") &&
        attendanceSubmitted
      ) {
        return false;
      }
      if (
        (item.type === "feeding_reminder" ||
          item.type === "feeding_incomplete") &&
        (feedingSubmitted || feedingNotRequired)
      ) {
        return false;
      }
      return true;
    });
  }, [
    recentNotifications,
    attendanceSubmitted,
    feedingSubmitted,
    feedingNotRequired,
  ]);

  const dashboardHero = (
    <LinearGradient
      colors={TEACHER_HEADER_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 14,
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text
            className="text-3xl font-extrabold text-white"
            accessibilityRole="header"
            numberOfLines={2}
          >
            Good day, {teacherName}
          </Text>
          <Text className="mt-1 text-base text-emerald-50" numberOfLines={2}>
            Keep today&apos;s class moving forward.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(teacher)/notifications")}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          accessibilityHint="Shows teacher alerts and reminders"
          className="relative h-12 w-12 items-center justify-center rounded-2xl bg-white/20 active:bg-white/30"
        >
          <Bell size={26} color="#FFFFFF" />
          {actionableNotifications.length > 0 ? (
            <View
              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-teal-700 bg-orange-300"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          ) : null}
        </Pressable>
      </View>

      <View className="mt-3.5 flex-row items-center rounded-xl bg-white/15 px-3.5 py-2.5">
        <CalendarDays size={18} color="#D1FAE5" />
        <Text className="ml-2 text-sm font-semibold text-white">
          {dateLabel}
        </Text>
        <View className="mx-2.5 h-4 w-px bg-white/30" />
        <School size={18} color="#D1FAE5" />
        <Text
          className="ml-2 flex-1 text-sm font-medium text-emerald-50"
          numberOfLines={1}
        >
          {centerName}
        </Text>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        {dashboardHero}
        <ScreenLoadingState
          title="Loading dashboard"
          message="Preparing today’s class information."
        />
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        {dashboardHero}
        <View className="-mt-6 flex-1 items-center justify-center rounded-t-3xl bg-gray-50 px-6">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
            <AlertCircle size={40} color="#DC2626" />
          </View>
          <Text
            className="mt-5 text-center text-2xl font-extrabold text-gray-900"
            accessibilityRole="header"
          >
            Couldn&apos;t load your dashboard
          </Text>
          <Text className="mt-2 max-w-sm text-center text-base leading-6 text-gray-600">
            {error} Check your connection, then try again.
          </Text>
          <Pressable
            onPress={onRefresh}
            disabled={refreshing}
            accessibilityRole="button"
            accessibilityLabel={
              refreshing ? "Retrying dashboard" : "Retry loading dashboard"
            }
            accessibilityState={{ disabled: refreshing, busy: refreshing }}
            className={`mt-6 min-h-12 flex-row items-center justify-center rounded-2xl px-6 py-3 ${
              refreshing ? "bg-teal-400" : "bg-teal-700 active:opacity-90"
            }`}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw size={18} color="#FFFFFF" />
            )}
            <Text className="ml-2 text-base font-bold text-white">
              {refreshing ? "Retrying..." : "Try Again"}
            </Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell withKeyboardAvoiding={false}>
      {dashboardHero}

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
            tintColor="#0F766E"
            colors={["#0F766E"]}
          />
        }
      >
        <View className="mb-5">
          <Text
            className="text-2xl font-black text-gray-900"
            accessibilityRole="header"
          >
            Today&apos;s overview
          </Text>
          <Text className="mt-0.5 text-base text-gray-600">
            Your latest class numbers
          </Text>

          <View className="mt-3.5 flex-row gap-3">
            <TeacherOverviewStatCard
              icon={Users}
              value={totalChildren}
              label="Total children"
              caption="Assigned to you"
              tone="sky"
              onPress={() => router.push("/(teacher)/children")}
              accessibilityHint="Opens your enrolled children roster"
              accessibilityLabel={`${totalChildren} total ${
                totalChildren === 1 ? "child" : "children"
              } in your class`}
            />

            <TeacherOverviewStatCard
              icon={UserCheck}
              value={attendanceAvailable ? presentToday : "--"}
              label="Present today"
              caption={
                !hasChildren
                  ? "No children assigned"
                  : attendanceAvailable
                    ? "In class"
                    : "Awaiting attendance"
              }
              tone="emerald"
              muted={!attendanceAvailable}
              onPress={
                hasChildren
                  ? () => router.push("/(teacher)/children")
                  : undefined
              }
              accessibilityHint={
                hasChildren ? "Opens your enrolled children roster" : undefined
              }
              accessibilityLabel={
                !hasChildren
                  ? "Present today is unavailable because no children are assigned"
                  : attendanceAvailable
                    ? `${presentToday} ${presentToday === 1 ? "child" : "children"} present today`
                    : "Present today is awaiting attendance"
              }
            />
          </View>

          <View className="mt-3 flex-row gap-3">
            <TeacherOverviewStatCard
              icon={UserX}
              value={attendanceAvailable ? absentToday : "--"}
              label="Absent today"
              caption={
                !hasChildren
                  ? "No children assigned"
                  : attendanceSubmitted
                    ? "Not in class"
                    : "Awaiting attendance"
              }
              tone="rose"
              muted={!attendanceAvailable}
              onPress={
                hasChildren
                  ? () => router.push("/(teacher)/children")
                  : undefined
              }
              accessibilityHint={
                hasChildren ? "Opens your enrolled children roster" : undefined
              }
              accessibilityLabel={
                !hasChildren
                  ? "Absent today is unavailable because no children are assigned"
                  : attendanceSubmitted
                    ? `${absentToday} ${absentToday === 1 ? "child" : "children"} absent today`
                    : "Absent today is awaiting attendance"
              }
            />

            <TeacherOverviewStatCard
              icon={Utensils}
              value={mealsCompletedValue}
              label="Meals completed"
              caption={mealsCompletedCaption}
              tone="orange"
              muted={!feedingSubmitted && !feedingNotRequired}
              onPress={
                feedingSubmitted
                  ? () => router.push("/(teacher)/teacher-record-data/feeding")
                  : undefined
              }
              accessibilityHint={
                feedingSubmitted ? "Opens today's feeding record" : undefined
              }
              accessibilityLabel={
                !hasChildren
                  ? "Meals completed is unavailable because no children are assigned"
                  : feedingSubmitted
                    ? `${feedingDone} meals completed and ${feedingMissed} missed today`
                    : feedingNotRequired
                      ? "Meal record is not needed today"
                      : "Meals completed is awaiting the meal record"
              }
            />
          </View>
        </View>

        <View className="mb-2.5 flex-row items-end justify-between">
          <View>
            <Text
              className="text-2xl font-black text-gray-900"
              accessibilityRole="header"
            >
              Start here
            </Text>
            <Text
              className={`mt-0.5 text-base ${
                allDailyTasksDone
                  ? "font-semibold text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              {allDailyTasksDone
                ? "All daily tasks completed for today ✓"
                : "Your primary tasks for today"}
            </Text>
          </View>
        </View>

        <View className="mb-5 gap-3">
          <Pressable
            onPress={() =>
              router.push("/(teacher)/teacher-record-data/attendance")
            }
            disabled={!hasChildren}
            accessibilityRole="button"
            accessibilityLabel={
              attendanceSubmitted
                ? "View submitted attendance"
                : !hasChildren
                  ? "Attendance unavailable because no children are assigned"
                  : "Record today's attendance"
            }
            accessibilityState={{ disabled: !hasChildren }}
            className={`min-h-32 flex-row items-center rounded-3xl border p-4 shadow-sm active:opacity-85 ${
              hasChildren
                ? "border-sky-200 bg-sky-50"
                : "border-gray-200 bg-gray-100 opacity-70"
            }`}
          >
            <View
              className={`h-14 w-14 items-center justify-center rounded-2xl ${
                hasChildren ? "bg-sky-600" : "bg-gray-400"
              }`}
            >
              <ClipboardCheck size={27} color="#FFFFFF" />
            </View>
            <View className="ml-4 flex-1 py-0.5">
              <Text className="text-xl font-extrabold text-gray-900">
                Attendance
              </Text>
              <View className="mt-1.5 flex-row items-center">
                {attendanceSubmitted ? (
                  <CheckCircle2 size={17} color="#047857" />
                ) : (
                  <Clock3 size={17} color="#0369A1" />
                )}
                <Text
                  className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                    attendanceSubmitted
                      ? "text-emerald-700"
                      : hasChildren
                        ? "text-sky-700"
                        : "text-gray-500"
                  }`}
                >
                  {attendanceSubmitted
                    ? "Completed today"
                    : hasChildren
                      ? "Ready to record"
                      : "No children"}
                </Text>
              </View>
              <Text className="mt-1.5 text-sm leading-5 text-gray-600">
                {attendanceSubmitted
                  ? "Review today's submitted record."
                  : "Check who is present in class."}
              </Text>
            </View>
            {hasChildren ? (
              <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-sky-600 shadow-sm">
                <ArrowUpRight size={21} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() =>
              router.push("/(teacher)/teacher-record-data/feeding")
            }
            disabled={!feedingActionEnabled}
            accessibilityRole="button"
            accessibilityLabel={
              feedingSubmitted
                ? "View submitted feeding record"
                : !hasChildren
                  ? "Feeding unavailable because no children are assigned"
                  : feedingNotRequired
                    ? "Feeding is not needed because no children are present"
                    : attendanceSubmitted
                      ? "Record today's feeding"
                      : "Complete attendance before recording feeding"
            }
            accessibilityState={{ disabled: !feedingActionEnabled }}
            className={`min-h-32 flex-row items-center rounded-3xl border p-4 shadow-sm active:opacity-85 ${
              feedingActionEnabled || feedingSubmitted || feedingNotRequired
                ? "border-orange-200 bg-orange-50"
                : "border-gray-200 bg-gray-100 opacity-70"
            }`}
          >
            <View
              className={`h-14 w-14 items-center justify-center rounded-2xl ${
                feedingActionEnabled || feedingSubmitted || feedingNotRequired
                  ? "bg-orange-500"
                  : "bg-gray-400"
              }`}
            >
              <Utensils size={27} color="#FFFFFF" />
            </View>
            <View className="ml-4 flex-1 py-0.5">
              <Text className="text-xl font-extrabold text-gray-900">
                Feeding
              </Text>
              <View className="mt-1.5 flex-row items-center">
                {feedingSubmitted || feedingNotRequired ? (
                  <CheckCircle2 size={17} color="#047857" />
                ) : (
                  <Clock3 size={17} color="#C2410C" />
                )}
                <Text
                  className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                    feedingSubmitted || feedingNotRequired
                      ? "text-emerald-700"
                      : feedingActionEnabled
                        ? "text-orange-700"
                        : "text-gray-500"
                  }`}
                >
                  {feedingSubmitted
                    ? "Completed today"
                    : feedingNotRequired
                      ? "Skipped today"
                      : feedingActionEnabled
                        ? "Ready to record"
                        : "Finish attendance first"}
                </Text>
              </View>
              <Text className="mt-1.5 text-sm leading-5 text-gray-600">
                {feedingSubmitted
                  ? "Review today's submitted record."
                  : feedingNotRequired
                    ? "No present children today."
                    : attendanceSubmitted
                      ? "Track today's meal completion."
                      : "Locked until attendance is done."}
              </Text>
            </View>
            {(feedingActionEnabled || feedingSubmitted || feedingNotRequired) ? (
              <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-orange-500 shadow-sm">
                <ArrowUpRight size={21} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text
              className="text-2xl font-black text-gray-900"
              accessibilityRole="header"
            >
              Notifications
            </Text>
            <Text className="mt-0.5 text-base text-gray-600">
              Reminders that need your attention
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(teacher)/notifications")}
            accessibilityRole="button"
            accessibilityLabel="View all notifications"
            className="min-h-11 flex-row items-center justify-center rounded-full border border-gray-100 bg-white px-4 shadow-sm active:opacity-75"
          >
            <Text className="text-sm font-extrabold text-emerald-800">
              View all
            </Text>
          </Pressable>
        </View>

        {actionableNotifications.length > 0 ? (
          <View className="rounded-3xl bg-white p-3.5 border border-gray-100 shadow-sm">
            {actionableNotifications.slice(0, 3).map((item, index) => {
              const ui = NOTICE_TYPE_UI[item.type];
              const title =
                item.title === "Reminder" ? ui.fallbackTitle : item.title;

              const handleNotificationPress = () => {
                if (
                  item.type === "attendance_reminder" ||
                  item.type === "attendance_incomplete"
                ) {
                  router.push("/(teacher)/teacher-record-data/attendance");
                } else if (
                  item.type === "feeding_reminder" ||
                  item.type === "feeding_incomplete"
                ) {
                  router.push("/(teacher)/teacher-record-data/feeding");
                } else {
                  router.push("/(teacher)/notifications");
                }
              };

              const notificationHint =
                item.type === "attendance_reminder" ||
                item.type === "attendance_incomplete"
                  ? "Opens attendance record"
                  : item.type === "feeding_reminder" ||
                      item.type === "feeding_incomplete"
                    ? "Opens feeding record"
                    : "Opens all notifications";

              return (
                <React.Fragment key={item.id}>
                  <NoticeItem
                    title={title}
                    desc={item.message}
                    meta={item.timeLabel}
                    tone={ui.tone}
                    onPress={handleNotificationPress}
                    accessibilityHint={notificationHint}
                  />
                  {index < Math.min(actionableNotifications.length, 3) - 1 ? (
                    <View className="h-2.5" />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        ) : (
          <View className="items-center rounded-3xl bg-white px-5 py-8 border border-gray-100 shadow-sm">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
              <Bell size={26} color="#0F766E" />
            </View>
            <Text className="mt-3 text-lg font-extrabold text-gray-900">
              Quiet for now
            </Text>
            <Text className="mt-1 text-center text-base text-gray-600">
              New reminders will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

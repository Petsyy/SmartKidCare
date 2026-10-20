import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  School,
  Utensils,
  Sparkles,
} from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { NoticeItem } from "../components";
import {
  BRAND_HEADER_GRADIENT,
  ParentLoadingState,
  ScreenShell,
  RefreshableScrollView,
  OfflineStatusBanner,
} from "@/src/components/ui";
import { useSystemSettings } from "@/src/context/system-settings-context";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import type { ParentNotificationFeedItem } from "@/src/api/notifications.api";

const PARENT_NOTICE_TONE: Record<
  ParentNotificationFeedItem["type"],
  "emerald" | "blue" | "orange"
> = {
  attendance_submitted: "emerald",
  absence_alert: "orange",
  feeding_submitted: "blue",
  missed_meal_alert: "orange",
  pickup_code_generated: "blue",
  child_released: "emerald",
  pickup_reminder: "blue",
  competency_practice: "orange",
};

function getChildRecordStatus(record: any, childId?: string): string | null {
  if (!childId || !Array.isArray(record?.records)) return null;

  const childRecord = record.records.find((item: any) => {
    const recordChildId =
      typeof item?.child === "object" ? item.child?._id : item?.child;
    return String(recordChildId) === String(childId);
  });

  return typeof childRecord?.status === "string" ? childRecord.status : null;
}

function formatRecordTime(record: any): string | null {
  const timestamp = record?.updatedAt || record?.createdAt;
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

export default function ParentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const dashboardData = useParentDashboard();

  const {
    selectedChild,
    recentNotifications,
    stats,
    todayAttendanceRecord,
    todayFeedingRecord,
    loading,
    refreshing,
    error,
    onRefresh,
  } = dashboardData;

  const { settings, loading: settingsLoading } = useSystemSettings();
  const centerDisplay = getDaycareCenterDisplay(
    user?.daycareCenterId || (selectedChild as any)?.daycareCenter,
  );
  const centerName = settingsLoading
    ? "Loading center..."
    : centerDisplay.primary !== "No center assigned"
      ? centerDisplay.primary
      : settings?.schoolName || "Smart KidCare";

  const parentFirstName = user?.firstName?.trim();
  const greeting = parentFirstName
    ? `Good day, ${parentFirstName}`
    : "Good day, Parent";

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
    () => Math.max(96, insets.bottom + 88),
    [insets.bottom],
  );

  const childFullName = useMemo(() => {
    if (!selectedChild) return "";
    const middle = selectedChild.middleName
      ? ` ${selectedChild.middleName}`
      : "";
    return `${selectedChild.firstName}${middle} ${selectedChild.lastName}`
      .replace(/\s+/g, " ")
      .trim();
  }, [selectedChild]);

  const childAgeLabel =
    typeof selectedChild?.age === "number"
      ? `${selectedChild.age} ${selectedChild.age === 1 ? "year" : "years"} old`
      : "Age not available";
  const childGenderLabel = selectedChild?.gender
    ? `${String(selectedChild.gender).charAt(0).toUpperCase()}${String(
        selectedChild.gender,
      )
        .slice(1)
        .toLowerCase()}`
    : null;
  const childDetails = [childAgeLabel, childGenderLabel]
    .filter(Boolean)
    .join(" · ");
  const childFirstName = selectedChild?.firstName || "your child";

  const attendanceStatus = useMemo(
    () => getChildRecordStatus(todayAttendanceRecord, selectedChild?._id),
    [todayAttendanceRecord, selectedChild?._id],
  );
  const attendanceTime = useMemo(
    () => formatRecordTime(todayAttendanceRecord),
    [todayAttendanceRecord],
  );
  const attendanceSummary =
    attendanceStatus === "present"
      ? `Present — ${attendanceTime ? `Checked in at ${attendanceTime}` : "Checked in today"}`
      : attendanceStatus === "absent"
        ? `Absent — ${attendanceTime ? `Updated at ${attendanceTime}` : "Updated today"}`
        : attendanceStatus === "excused"
          ? `Excused — ${attendanceTime ? `Updated at ${attendanceTime}` : "Updated today"}`
          : "Attendance update pending";

  const mealStatus = useMemo(
    () => getChildRecordStatus(todayFeedingRecord, selectedChild?._id),
    [todayFeedingRecord, selectedChild?._id],
  );
  const mealTime = useMemo(
    () => formatRecordTime(todayFeedingRecord),
    [todayFeedingRecord],
  );
  const mealSummary =
    mealStatus === "completed"
      ? `Meal completed${mealTime ? ` — ${mealTime}` : " today"}`
      : mealStatus === "missed"
        ? `Meal missed${mealTime ? ` — ${mealTime}` : " today"}`
        : "Meal update pending";

  const dailySummary =
    attendanceStatus === "absent" && mealStatus === "missed"
      ? "Attendance and meal updates need your attention"
      : attendanceStatus === "absent"
        ? "Attendance needs your attention today"
        : mealStatus === "missed"
          ? "A meal was missed today"
          : !attendanceStatus || !mealStatus
            ? "Some updates are still pending today"
            : "No concerns reported today";

  const dashboardHero = (
    <>
      <LinearGradient
        colors={BRAND_HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        {/* Top Greeting Row */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text
              className="text-3xl font-extrabold text-white"
              accessibilityRole="header"
              numberOfLines={2}
            >
              {greeting}
            </Text>
            <Text
              className="mt-0.5 text-base text-emerald-50"
              numberOfLines={2}
            >
              Here&apos;s what&apos;s happening today.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(parent)/notifications")}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            accessibilityHint="Shows parent alerts and daily updates"
            className="relative h-12 w-12 items-center justify-center rounded-2xl bg-white/20 active:bg-white/30"
          >
            <Bell size={26} color="#FFFFFF" />
            {recentNotifications.length > 0 ? (
              <View
                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-teal-700 bg-orange-300"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            ) : null}
          </Pressable>
        </View>

        {/* Date & Center Info Pill */}
        <View className="mt-3 flex-row items-center rounded-xl bg-white/15 px-3.5 py-2.5">
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
      <OfflineStatusBanner />
    </>
  );

  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        {dashboardHero}
        <ParentLoadingState
          variant="dashboard"
          title="Loading dashboard"
          message="Getting today's updates ready."
        />
      </ScreenShell>
    );
  }

  if (error || !selectedChild) {
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
            {error ? "Couldn't load dashboard" : "No Children Linked"}
          </Text>
          <Text className="mt-2 max-w-sm text-center text-base leading-6 text-gray-600">
            {error
              ? `${error} Check your connection, then try again.`
              : "No children are currently linked to your parent account."}
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
    <ScreenShell edges={[]} withKeyboardAvoiding={false}>
      {dashboardHero}

      <RefreshableScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: scrollBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshColor="#0F766E"
      >
        {/* ── Compact Child Information & Today's Updates Card ── */}
        <Pressable
          onPress={() => router.push("/(parent)/children")}
          accessibilityRole="button"
          accessibilityLabel={`${childFullName}. ${childDetails}. Attendance: ${attendanceStatus === "present" ? "Present" : attendanceStatus === "absent" ? "Absent" : "Not recorded"}. Feeding: ${mealStatus === "completed" ? "Finished" : mealStatus === "missed" ? "Not finished" : "Not recorded"}. View child's profile and records.`}
          accessibilityHint="Opens your child's full profile and records"
          className="mb-5 overflow-hidden rounded-3xl bg-white border border-gray-100 p-5 shadow-sm active:bg-gray-50/80"
        >
          {/* 1. Compact Child Profile Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-2 gap-2.5">
              <Text
                className="text-2xl font-black text-gray-900 leading-8"
                numberOfLines={1}
              >
                {childFullName}
              </Text>
              <View className="flex-row items-center rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="text-xs font-bold text-emerald-800">
                  Enrolled
                </Text>
              </View>
            </View>

            <Text className="text-sm font-bold text-gray-500">
              {childDetails}
            </Text>
          </View>

          {/* 2 & 3. Today's Updates (Softly Tinted Container with 2 Compact Rows) */}
          <View className="mt-4 rounded-2xl bg-teal-50/50 p-4 border border-teal-100/60">
            {/* Row 1: Attendance */}
            <View className="flex-row items-center justify-between py-0.5">
              <View className="flex-row items-center flex-1 pr-3 gap-3">
                <View
                  className={`h-11 w-11 items-center justify-center rounded-xl ${
                    attendanceStatus === "present"
                      ? "bg-emerald-100"
                      : attendanceStatus === "absent"
                        ? "bg-rose-100"
                        : "bg-gray-100"
                  }`}
                >
                  <ClipboardCheck
                    size={24}
                    color={
                      attendanceStatus === "present"
                        ? "#047857"
                        : attendanceStatus === "absent"
                          ? "#DC2626"
                          : "#6B7280"
                    }
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900">
                    Attendance
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-xs font-medium text-gray-500 mt-0.5"
                  >
                    {attendanceStatus === "present"
                      ? attendanceTime
                        ? `Checked in at ${attendanceTime}`
                        : "Checked in for class"
                      : attendanceStatus === "absent"
                        ? "Reported absent today"
                        : "Awaiting teacher update"}
                  </Text>
                </View>
              </View>

              <View
                className={`rounded-full px-3.5 py-1 border ${
                  attendanceStatus === "present"
                    ? "bg-emerald-50 border-emerald-200"
                    : attendanceStatus === "absent"
                      ? "bg-rose-50 border-rose-200"
                      : "bg-gray-100 border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-extrabold ${
                    attendanceStatus === "present"
                      ? "text-emerald-700"
                      : attendanceStatus === "absent"
                        ? "text-rose-700"
                        : "text-gray-600"
                  }`}
                >
                  {attendanceStatus === "present"
                    ? "Present"
                    : attendanceStatus === "absent"
                      ? "Absent"
                      : "Not Recorded"}
                </Text>
              </View>
            </View>

            {/* Subtle Divider */}
            <View className="my-3 h-px bg-teal-100/70" />

            {/* Row 2: Feeding */}
            <View className="flex-row items-center justify-between py-0.5">
              <View className="flex-row items-center flex-1 pr-3 gap-3">
                <View
                  className={`h-11 w-11 items-center justify-center rounded-xl ${
                    mealStatus === "completed"
                      ? "bg-emerald-100"
                      : mealStatus === "missed"
                        ? "bg-amber-100"
                        : "bg-gray-100"
                  }`}
                >
                  <Utensils
                    size={24}
                    color={
                      mealStatus === "completed"
                        ? "#047857"
                        : mealStatus === "missed"
                          ? "#D97706"
                          : "#6B7280"
                    }
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900">
                    Feeding
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-xs font-medium text-gray-500 mt-0.5"
                  >
                    {mealStatus === "completed"
                      ? mealTime
                        ? `Served at ${mealTime}`
                        : "Completed meal session"
                      : mealStatus === "missed"
                        ? "Missed scheduled meal"
                        : "Awaiting teacher update"}
                  </Text>
                </View>
              </View>

              <View
                className={`rounded-full px-3.5 py-1 border ${
                  mealStatus === "completed"
                    ? "bg-emerald-50 border-emerald-200"
                    : mealStatus === "missed"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-gray-100 border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-extrabold ${
                    mealStatus === "completed"
                      ? "text-emerald-700"
                      : mealStatus === "missed"
                        ? "text-amber-700"
                        : "text-gray-600"
                  }`}
                >
                  {mealStatus === "completed"
                    ? "Finished"
                    : mealStatus === "missed"
                      ? "Not Finished"
                      : "Not Recorded"}
                </Text>
              </View>
            </View>
          </View>

          {/* 4. Bottom Navigation */}
          <View className="mt-3.5 flex-row items-center justify-between border-t border-gray-100 pt-3">
            <Text className="text-sm font-extrabold text-teal-700">
              View child&apos;s profile & records
            </Text>
            <ChevronRight size={19} color="#0D9488" />
          </View>
        </Pressable>

        {/* Section 1: Records and History */}
        <View className="mb-2.5 flex-row items-end justify-between">
          <View>
            <Text
              className="text-2xl font-black text-gray-900"
              accessibilityRole="header"
            >
              Records and history
            </Text>
            <Text className="mt-0.5 text-base text-gray-600">
              Review past attendance and meal updates
            </Text>
          </View>
        </View>

        <View className="mb-6 gap-3">
          <Pressable
            onPress={() =>
              router.push("/(parent)/parent-view-record/attendance")
            }
            accessibilityRole="button"
            accessibilityLabel={`See ${childFirstName}'s attendance records. Today: ${attendanceStatus ? "recorded" : "no update yet"}. History: ${stats.present} present and ${stats.absent} absent.`}
            accessibilityHint="Opens attendance history"
            className="min-h-28 flex-row items-center rounded-3xl border border-teal-200 bg-teal-50 p-4 shadow-sm active:opacity-85"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-600">
              <ClipboardCheck size={27} color="#FFFFFF" />
            </View>
            <View className="ml-4 flex-1 py-0.5">
              <Text className="text-xl font-extrabold text-gray-900">
                Attendance
              </Text>
              <View className="mt-1.5 flex-row items-center">
                {attendanceStatus === "present" ? (
                  <CheckCircle2 size={17} color="#047857" />
                ) : attendanceStatus === "absent" ||
                  attendanceStatus === "excused" ? (
                  <AlertCircle size={17} color="#BE123C" />
                ) : (
                  <Clock3 size={17} color="#0F766E" />
                )}
                <Text
                  className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                    attendanceStatus === "present"
                      ? "text-emerald-700"
                      : attendanceStatus === "absent"
                        ? "text-rose-600"
                        : attendanceStatus === "excused"
                          ? "text-amber-700"
                          : "text-teal-700"
                  }`}
                >
                  Today: {attendanceStatus ? "Recorded" : "No update yet"}
                </Text>
              </View>
              <Text className="mt-2 text-base font-semibold leading-5 text-gray-700">
                {stats.present} present · {stats.absent} absent
              </Text>
            </View>
            <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-teal-600 shadow-sm">
              <ArrowUpRight size={21} color="#FFFFFF" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(parent)/parent-view-record/feeding")}
            accessibilityRole="button"
            accessibilityLabel={`See ${childFirstName}'s meal records. Today: ${mealStatus ? "recorded" : "no meal update yet"}. History: ${stats.mealsCompleted} finished${stats.mealsMissed > 0 ? ` and ${stats.mealsMissed} missed` : ""}.`}
            accessibilityHint="Opens meal history"
            className="min-h-28 flex-row items-center rounded-3xl border border-orange-200 bg-orange-50 p-4 shadow-sm active:opacity-85"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
              <Utensils size={27} color="#FFFFFF" />
            </View>
            <View className="ml-4 flex-1 py-0.5">
              <Text className="text-xl font-extrabold text-gray-900">
                Meals
              </Text>
              <View className="mt-1.5 flex-row items-center">
                {mealStatus === "completed" ? (
                  <CheckCircle2 size={17} color="#047857" />
                ) : mealStatus === "missed" ? (
                  <AlertCircle size={17} color="#C2410C" />
                ) : (
                  <Clock3 size={17} color="#C2410C" />
                )}
                <Text
                  className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                    mealStatus === "completed"
                      ? "text-emerald-700"
                      : "text-orange-700"
                  }`}
                >
                  Today: {mealStatus ? "Recorded" : "No meal update yet"}
                </Text>
              </View>
              <Text className="mt-2 text-base font-semibold leading-5 text-gray-700">
                {stats.mealsCompleted} finished
                {stats.mealsMissed > 0 ? ` · ${stats.mealsMissed} missed` : ""}
              </Text>
            </View>
            <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-orange-500 shadow-sm">
              <ArrowUpRight size={21} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {/* Section 2: Recent Updates (Notifications Feed) */}
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text
              className="text-2xl font-black text-gray-900"
              accessibilityRole="header"
            >
              Recent updates
            </Text>
            <Text className="mt-0.5 text-base text-gray-600">
              School updates about {childFirstName}
            </Text>
          </View>
          {recentNotifications.length > 0 ? (
            <Pressable
              onPress={() => router.push("/(parent)/notifications")}
              accessibilityRole="button"
              accessibilityLabel="View all notifications"
              className="min-h-11 flex-row items-center justify-center rounded-full border border-gray-100 bg-white px-4 shadow-sm active:opacity-75"
            >
              <Text className="text-sm font-extrabold text-gray-700">
                View all
              </Text>
            </Pressable>
          ) : null}
        </View>

        {recentNotifications.length > 0 ? (
          <View className="rounded-3xl border border-gray-100 bg-white p-3.5 shadow-sm">
            {recentNotifications.slice(0, 3).map((item, index) => {
              const tone = PARENT_NOTICE_TONE[item.type] || "emerald";

              const handleNotificationPress = () => {
                if (
                  item.type === "attendance_submitted" ||
                  item.type === "absence_alert"
                ) {
                  router.push("/(parent)/parent-view-record/attendance");
                } else if (
                  item.type === "feeding_submitted" ||
                  item.type === "missed_meal_alert"
                ) {
                  router.push("/(parent)/parent-view-record/feeding");
                } else {
                  router.push("/(parent)/notifications");
                }
              };

              const notificationHint =
                item.type === "attendance_submitted" ||
                item.type === "absence_alert"
                  ? "Opens attendance record"
                  : item.type === "feeding_submitted" ||
                      item.type === "missed_meal_alert"
                    ? "Opens feeding record"
                    : "Opens all notifications";

              return (
                <React.Fragment key={item.id}>
                  <NoticeItem
                    title={item.title}
                    desc={item.message}
                    meta={item.timeLabel}
                    tone={tone}
                    onPress={handleNotificationPress}
                    accessibilityHint={notificationHint}
                  />
                  {index < Math.min(recentNotifications.length, 3) - 1 ? (
                    <View className="h-2.5" />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        ) : (
          <View className="items-center rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <View className="h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
              <Bell size={22} color="#6B7280" />
            </View>
            <Text className="mt-2 text-lg font-extrabold text-gray-900">
              Quiet for now
            </Text>
            <Text className="mt-0.5 text-center text-sm leading-5 text-gray-600">
              New school updates for {childFirstName} will appear here.
            </Text>
          </View>
        )}
      </RefreshableScrollView>
    </ScreenShell>
  );
}

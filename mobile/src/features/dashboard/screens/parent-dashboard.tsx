import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/hooks/use-auth";
import { useParentDashboard } from "../hooks/useParentDashboard";
import {
  ParentChildOverviewCard,
  ParentDashboardErrorState,
  ParentDashboardHero,
  ParentNoticesSection,
  ParentRecordsSection,
} from "../components/parent";
import {
  ParentLoadingState,
  RefreshableScrollView,
  ScreenShell,
} from "@/src/components/ui";
import { useSystemSettings } from "@/src/context/system-settings-context";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import type { ParentNotificationFeedItem } from "@/src/api/notifications.api";

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

  const mealStatus = useMemo(
    () => getChildRecordStatus(todayFeedingRecord, selectedChild?._id),
    [todayFeedingRecord, selectedChild?._id],
  );
  const mealTime = useMemo(
    () => formatRecordTime(todayFeedingRecord),
    [todayFeedingRecord],
  );

  const handleOpenNotifications = () => {
    router.push("/(parent)/notifications");
  };

  const handleOpenChildren = () => {
    router.push("/(parent)/children");
  };

  const handleOpenAttendance = () => {
    router.push("/(parent)/parent-view-record/attendance");
  };

  const handleOpenMeals = () => {
    router.push("/(parent)/parent-view-record/feeding");
  };

  const handlePressNotice = (item: ParentNotificationFeedItem) => {
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

  const hero = (
    <ParentDashboardHero
      topInset={insets.top}
      greeting={greeting}
      centerName={centerName}
      dateLabel={dateLabel}
      hasNotifications={recentNotifications.length > 0}
      onOpenNotifications={handleOpenNotifications}
    />
  );

  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        {hero}
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
      <ParentDashboardErrorState
        hero={hero}
        error={error}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <ScreenShell edges={[]} withKeyboardAvoiding={false}>
      {hero}

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
        <ParentChildOverviewCard
          childFullName={childFullName}
          childDetails={childDetails}
          attendanceStatus={attendanceStatus}
          attendanceTime={attendanceTime}
          mealStatus={mealStatus}
          mealTime={mealTime}
          onPress={handleOpenChildren}
        />

        <ParentRecordsSection
          childFirstName={childFirstName}
          attendanceStatus={attendanceStatus}
          presentCount={stats.present}
          absentCount={stats.absent}
          mealStatus={mealStatus}
          mealsCompleted={stats.mealsCompleted}
          mealsMissed={stats.mealsMissed}
          onOpenAttendance={handleOpenAttendance}
          onOpenMeals={handleOpenMeals}
        />

        <ParentNoticesSection
          childFirstName={childFirstName}
          notifications={recentNotifications}
          onViewAll={handleOpenNotifications}
          onPressNotice={handlePressNotice}
        />
      </RefreshableScrollView>
    </ScreenShell>
  );
}

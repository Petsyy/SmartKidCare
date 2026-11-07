import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TeacherNotificationFeedItem } from "@/src/api/notifications.api";
import {
  RefreshableScrollView,
  ScreenLoadingState,
  ScreenShell,
} from "@/src/components/ui";
import { useSystemSettings } from "@/src/context/system-settings-context";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import {
  TeacherAssessmentsSection,
  TeacherDailyTasksSection,
  TeacherDashboardErrorState,
  TeacherDashboardHero,
  TeacherNoticesSection,
  TeacherOverviewSection,
} from "../components/teacher";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";

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
    underweightCount,
    severelyUnderweightCount,
    overweightCount,
    obeseCount,
    pendingPickups,
    attendanceData,
    feedingData,
    recentNotifications,
    daycareCenter,
    onRefresh,
  } = useTeacherDashboard();
  const { settings, loading: settingsLoading } = useSystemSettings();

  const centerDisplay = getDaycareCenterDisplay(daycareCenter);
  const centerName = settingsLoading
    ? "Loading center..."
    : centerDisplay.primary !== "No center assigned"
      ? centerDisplay.primary
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
  const feedingActionEnabled = hasChildren;

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

  const handleOpenNotifications = () => {
    router.push("/(teacher)/notifications");
  };

  const handleOpenChildren = () => {
    router.push("/(teacher)/children");
  };

  const handleOpenPickup = () => {
    router.push("/(teacher)/pickup");
  };

  const handleOpenNutrition = () => {
    router.push("/(teacher)/teacher-record-data/nutrition");
  };

  const handleOpenAttendance = () => {
    router.push("/(teacher)/teacher-record-data/attendance");
  };

  const handleOpenFeeding = () => {
    router.push("/(teacher)/teacher-record-data/feeding");
  };

  const handleOpenCompetencies = () => {
    router.push("/(teacher)/teacher-record-data/competencies");
  };

  const handlePressNotice = (item: TeacherNotificationFeedItem) => {
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

  const hero = (
    <TeacherDashboardHero
      topInset={insets.top}
      teacherName={teacherName}
      centerName={centerName}
      dateLabel={dateLabel}
      hasNotifications={actionableNotifications.length > 0}
      onOpenNotifications={handleOpenNotifications}
    />
  );

  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        {hero}
        <ScreenLoadingState
          variant="dashboard"
          title="Loading dashboard"
          message="Preparing today’s class information."
        />
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <TeacherDashboardErrorState
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
          paddingTop: 20,
          paddingBottom: scrollBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshColor="#0F766E"
      >
        <TeacherOverviewSection
          totalChildren={totalChildren}
          presentToday={presentToday}
          absentToday={absentToday}
          pendingPickups={pendingPickups}
          underweightCount={underweightCount}
          severelyUnderweightCount={severelyUnderweightCount}
          overweightCount={overweightCount}
          obeseCount={obeseCount}
          hasChildren={hasChildren}
          attendanceSubmitted={attendanceSubmitted}
          attendanceAvailable={attendanceAvailable}
          onOpenChildren={handleOpenChildren}
          onOpenPickup={handleOpenPickup}
          onOpenNutrition={handleOpenNutrition}
        />

        <TeacherDailyTasksSection
          hasChildren={hasChildren}
          attendanceSubmitted={attendanceSubmitted}
          feedingSubmitted={feedingSubmitted}
          feedingNotRequired={feedingNotRequired}
          feedingActionEnabled={feedingActionEnabled}
          allDailyTasksDone={allDailyTasksDone}
          onOpenAttendance={handleOpenAttendance}
          onOpenFeeding={handleOpenFeeding}
        />

        <TeacherAssessmentsSection
          hasChildren={hasChildren}
          onOpenNutrition={handleOpenNutrition}
          onOpenCompetencies={handleOpenCompetencies}
        />

        <TeacherNoticesSection
          notifications={actionableNotifications}
          onViewAll={handleOpenNotifications}
          onPressNotice={handlePressNotice}
        />
      </RefreshableScrollView>
    </ScreenShell>
  );
}

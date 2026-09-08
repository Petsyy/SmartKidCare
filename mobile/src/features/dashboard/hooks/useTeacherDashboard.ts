import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import { getProfile } from "@/src/api/authentication.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import type { Child } from "@/src/api/api.types";
import {
  getTeacherNotificationsFeed,
  type TeacherNotificationFeedItem,
} from "@/src/api/notifications.api";
import { getPickupEligibleChildren } from "@/src/api/pickup.api";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { getManilaDateKey } from "@/src/utils/manila-date";
import { useFocusEffect } from "expo-router";
import { loadNotificationArchiveState } from "@/src/utils/notification-archive-storage";
import type { DaycareCenterDisplayInput } from "@/src/utils/daycare-center-format";

export interface TeacherDashboardData {
  children: Child[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  attendanceData: any;
  feedingData: any;
  recentNotifications: TeacherNotificationFeedItem[];
  teacherName: string;
  daycareCenter: DaycareCenterDisplayInput;
  totalChildren: number;
  presentToday: number;
  absentToday: number;
  feedingDone: number;
  feedingMissed: number;
  pendingPickups: number;
  onRefresh: () => void;
}

export function useTeacherDashboard(): TeacherDashboardData {
  const { isAuthenticated, user } = useAuth();
  const todayDateKey = useMemo(() => getManilaDateKey(), []);

  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadState = async () => {
        if (!user?.id) return;
        const state = await loadNotificationArchiveState({
          audience: "teacher",
          userId: user.id,
        });
        if (!isMounted) return;
        setArchivedIds(new Set(state.archivedItems.map((item) => item.id)));
        setDeletedIds(new Set(state.deletedIds || []));
      };
      void loadState();
      return () => {
        isMounted = false;
      };
    }, [user?.id])
  );

  const {
    data,
    error: queryError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: mobileQueryKeys.teacherDashboard(todayDateKey),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [
        children,
        attendanceData,
        feedingData,
        profileData,
        notificationsFeed,
        pickupEligibleChildren,
      ] = await Promise.all([
        getChildren(),
        getTodayAttendance(),
        getTodayFeeding(),
        getProfile(),
        getTeacherNotificationsFeed({ date: todayDateKey }).catch(() => null),
        getPickupEligibleChildren().catch(() => []),
      ]);
      return {
        children,
        attendanceData,
        feedingData,
        recentNotifications: notificationsFeed?.notifications || [],
        teacherName: profileData?.firstName || "Teacher",
        daycareCenter: profileData?.daycareCenter,
        pendingPickups: pickupEligibleChildren?.length || 0,
      };
    },
  });

  const children: Child[] = data?.children ?? [];
  const attendanceData = data?.attendanceData ?? null;
  const feedingData = data?.feedingData ?? null;
  const recentNotificationsRaw: TeacherNotificationFeedItem[] =
    data?.recentNotifications ?? [];
  const teacherName = data?.teacherName || "Teacher";
  const daycareCenter = data?.daycareCenter;
  const pendingPickups = data?.pendingPickups || 0;

  const recentNotifications = useMemo(() => {
    return recentNotificationsRaw.filter(
      (item) => !archivedIds.has(item.id) && !deletedIds.has(item.id)
    );
  }, [recentNotificationsRaw, archivedIds, deletedIds]);

  const totalChildren = useMemo(() => children.length, [children.length]);
  const presentToday = useMemo(() => {
    if (!attendanceData?.records) return 0;
    return attendanceData.records.filter(
      (record: any) => record.status === "present",
    ).length;
  }, [attendanceData]);
  const absentToday = useMemo(() => {
    if (!attendanceData?.records) return 0;
    return attendanceData.records.filter(
      (record: any) => record.status === "absent",
    ).length;
  }, [attendanceData]);
  const feedingDone = useMemo(() => {
    if (!feedingData?.records) return 0;
    return feedingData.records.filter(
      (record: any) => record.status === "completed",
    ).length;
  }, [feedingData]);
  const feedingMissed = useMemo(() => {
    if (!feedingData?.records) return 0;
    return feedingData.records.filter(
      (record: any) => record.status === "missed",
    ).length;
  }, [feedingData]);

  const error =
    !data && queryError
      ? queryError instanceof Error
        ? queryError.message
        : "The dashboard could not be loaded."
      : null;

  const onRefresh = () => {
    void refetch();
  };

  return {
    children,
    loading: isLoading,
    refreshing: isRefetching,
    error,
    attendanceData,
    feedingData,
    recentNotifications,
    teacherName,
    daycareCenter,
    totalChildren,
    presentToday,
    absentToday,
    feedingDone,
    feedingMissed,
    pendingPickups,
    onRefresh,
  };
}

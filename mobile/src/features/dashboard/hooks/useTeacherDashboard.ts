import React, { useMemo } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren, getTeacherProfile } from "@/src/api/teacher.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";
import {
  getTeacherNotificationsFeed,
  type TeacherNotificationFeedItem,
} from "@/src/api/notifications.api";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export const toLocalDateKey = (value: Date = new Date()): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface TeacherDashboardData {
  children: Child[];
  loading: boolean;
  refreshing: boolean;
  attendanceData: any;
  feedingData: any;
  recentNotifications: TeacherNotificationFeedItem[];
  teacherName: string;
  totalChildren: number;
  presentToday: number;
  absentToday: number;
  feedingDone: number;
  onRefresh: () => void;
}

export function useTeacherDashboard(): TeacherDashboardData {
  const { token } = useAuth();
  const todayDateKey = useMemo(() => toLocalDateKey(), []);
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: mobileQueryKeys.teacherDashboard(token, todayDateKey),
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      const [
        children,
        attendanceData,
        feedingData,
        profileData,
        notificationsFeed,
      ] = await Promise.all([
        getChildren(token),
        getTodayAttendance(token),
        getTodayFeeding(token),
        getTeacherProfile(token),
        getTeacherNotificationsFeed(token, { date: todayDateKey }).catch(
          () => null,
        ),
      ]);
      return {
        children,
        attendanceData,
        feedingData,
        recentNotifications: notificationsFeed?.notifications || [],
        teacherName: profileData?.firstName || "Teacher",
      };
    },
  });
  const children: Child[] = data?.children ?? [];
  const attendanceData = data?.attendanceData ?? null;
  const feedingData = data?.feedingData ?? null;
  const recentNotifications: TeacherNotificationFeedItem[] =
    data?.recentNotifications ?? [];
  const teacherName = data?.teacherName || "Teacher";

  const totalChildren = useMemo(() => children.length, [children.length]);

  const presentToday = useMemo(() => {
    if (!attendanceData || !attendanceData.records) return 0;
    return attendanceData.records.filter(
      (record: any) => record.status === "present"
    ).length;
  }, [attendanceData]);

  const absentToday = useMemo(() => {
    if (!attendanceData || !attendanceData.records) return 0;
    return attendanceData.records.filter(
      (record: any) => record.status === "absent"
    ).length;
  }, [attendanceData]);

  const feedingDone = useMemo(() => {
    if (!feedingData || !feedingData.records) return 0;
    return feedingData.records.filter(
      (record: any) => record.status === "completed"
    ).length;
  }, [feedingData]);

  const onRefresh = () => {
    void refetch();
  };

  return {
    children,
    loading: isLoading,
    refreshing: isRefetching,
    attendanceData,
    feedingData,
    recentNotifications,
    teacherName,
    totalChildren,
    presentToday,
    absentToday,
    feedingDone,
    onRefresh,
  };
}

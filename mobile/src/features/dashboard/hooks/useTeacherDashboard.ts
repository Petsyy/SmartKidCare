import { useMemo } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import { getProfile } from "@/src/api/authentication.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import type { Child } from "@/src/api/api.types";
import {
  getTeacherNotificationsFeed,
  type TeacherNotificationFeedItem,
} from "@/src/api/notifications.api";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { getManilaDateKey } from "@/src/utils/manila-date";

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
  const { isAuthenticated } = useAuth();
  const todayDateKey = useMemo(() => getManilaDateKey(), []);
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: mobileQueryKeys.teacherDashboard(todayDateKey),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [children, attendanceData, feedingData, profileData, notificationsFeed] =
        await Promise.all([
          getChildren(),
          getTodayAttendance(),
          getTodayFeeding(),
          getProfile(),
          getTeacherNotificationsFeed({ date: todayDateKey }).catch(() => null),
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
  const recentNotifications: TeacherNotificationFeedItem[] = data?.recentNotifications ?? [];
  const teacherName = data?.teacherName || "Teacher";

  const totalChildren = useMemo(() => children.length, [children.length]);
  const presentToday = useMemo(() => {
    if (!attendanceData?.records) return 0;
    return attendanceData.records.filter((record: any) => record.status === "present").length;
  }, [attendanceData]);
  const absentToday = useMemo(() => {
    if (!attendanceData?.records) return 0;
    return attendanceData.records.filter((record: any) => record.status === "absent").length;
  }, [attendanceData]);
  const feedingDone = useMemo(() => {
    if (!feedingData?.records) return 0;
    return feedingData.records.filter((record: any) => record.status === "completed").length;
  }, [feedingData]);

  const onRefresh = () => { void refetch(); };

  return {
    children, loading: isLoading, refreshing: isRefetching, attendanceData,
    feedingData, recentNotifications, teacherName, totalChildren,
    presentToday, absentToday, feedingDone, onRefresh,
  };
}

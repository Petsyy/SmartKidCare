import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren, getTeacherProfile } from "@/src/api/teacher.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";
import {
  getTeacherNotificationsFeed,
  type TeacherNotificationFeedItem,
} from "@/src/api/notifications.api";

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
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [feedingData, setFeedingData] = useState<any>(null);
  const [recentNotifications, setRecentNotifications] = useState<
    TeacherNotificationFeedItem[]
  >([]);
  const [teacherName, setTeacherName] = useState<string>("Teacher");

  const todayDateKey = useMemo(() => toLocalDateKey(), []);

  const fetchData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) setLoading(true);

        if (token) {
          const [
            childrenData,
            todayAttendance,
            todayFeeding,
            profileData,
            notificationsFeed,
          ] = await Promise.all([
            getChildren(token),
            getTodayAttendance(token),
            getTodayFeeding(token),
            getTeacherProfile(token),
            getTeacherNotificationsFeed(token, { date: todayDateKey }).catch(
              () => null
            ),
          ]);
          setChildren(childrenData);
          setAttendanceData(todayAttendance);
          setFeedingData(todayFeeding);
          setRecentNotifications(notificationsFeed?.notifications || []);

          // Set teacher name from profile
          if (profileData?.firstName) {
            setTeacherName(profileData.firstName);
          }
        } else {
          setRecentNotifications([]);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    [token, todayDateKey]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    setRefreshing(true);
    fetchData(true);
  };

  return {
    children,
    loading,
    refreshing,
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

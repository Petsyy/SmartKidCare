import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, Child } from "@/src/api/parent.api";
import {
  getAttendanceHistory,
  getFeedingHistory,
  getTodayAttendance,
  getTodayFeeding,
} from "@/src/api/records.api";
import {
  getParentNotificationsFeed,
  type ParentNotificationFeedItem,
} from "@/src/api/notifications.api";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export interface ChildStats {
  present: number;
  absent: number;
  mealsCompleted: number;
  mealsMissed: number;
}

export interface ParentDashboardData {
  children: Child[];
  selectedChild: Child | null;
  attendanceRecords: any[];
  feedingRecords: any[];
  todayAttendanceRecord: any;
  todayFeedingRecord: any;
  recentNotifications: ParentNotificationFeedItem[];
  stats: ChildStats;
  presentToday: number;
  absentToday: number;
  feedingDoneToday: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function useParentDashboard(): ParentDashboardData {
  const { isAuthenticated } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: mobileQueryKeys.parentDashboard(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [children, attendanceRecords, feedingRecords, todayAttendanceRecord, todayFeedingRecord, parentNotifications] =
        await Promise.all([
          getMyChildren(),
          getAttendanceHistory(),
          getFeedingHistory(),
          getTodayAttendance().catch(() => null),
          getTodayFeeding().catch(() => null),
          getParentNotificationsFeed().catch(() => null),
        ]);
      return {
        children, attendanceRecords, feedingRecords, todayAttendanceRecord, todayFeedingRecord,
        recentNotifications: parentNotifications?.notifications?.length
          ? parentNotifications.notifications.slice(0, 2) : [],
      };
    },
  });

  const children: Child[] = data?.children ?? [];
  const attendanceRecords = data?.attendanceRecords ?? [];
  const feedingRecords = data?.feedingRecords ?? [];
  const todayAttendanceRecord = data?.todayAttendanceRecord ?? null;
  const todayFeedingRecord = data?.todayFeedingRecord ?? null;
  const recentNotifications: ParentNotificationFeedItem[] = data?.recentNotifications ?? [];

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0]._id);
    }
  }, [children, selectedChildId, setSelectedChildId]);

  const selectedChild = useMemo(() => {
    if (!selectedChildId) return children[0] ?? null;
    return children.find((c) => c._id === selectedChildId) ?? children[0] ?? null;
  }, [children, selectedChildId]);

  const stats = useMemo(() => {
    if (!selectedChild) return { present: 0, absent: 0, mealsCompleted: 0, mealsMissed: 0 };
    let present = 0, absent = 0, mealsCompleted = 0, mealsMissed = 0;
    attendanceRecords.forEach((record: any) => {
      if (record.records && Array.isArray(record.records)) {
        record.records.forEach((r: any) => {
          const childId = typeof r.child === "object" ? r.child._id : r.child;
          if (childId === selectedChild._id) {
            if (r.status === "present") present++;
            else if (r.status === "absent") absent++;
          }
        });
      }
    });
    feedingRecords.forEach((record: any) => {
      if (record.records && Array.isArray(record.records)) {
        record.records.forEach((r: any) => {
          const childId = typeof r.child === "object" ? r.child._id : r.child;
          if (childId === selectedChild._id) {
            if (r.status === "completed") mealsCompleted++;
            else if (r.status === "missed") mealsMissed++;
          }
        });
      }
    });
    return { present, absent, mealsCompleted, mealsMissed };
  }, [selectedChild, attendanceRecords, feedingRecords]);

  const presentToday = useMemo(() => {
    if (!todayAttendanceRecord?.records || !Array.isArray(todayAttendanceRecord.records)) return 0;
    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayAttendanceRecord.records.filter((record: any) => {
      const childId = typeof record?.child === "object" ? String(record?.child?._id) : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "present";
    }).length;
  }, [todayAttendanceRecord, children]);

  const absentToday = useMemo(() => {
    if (!todayAttendanceRecord?.records || !Array.isArray(todayAttendanceRecord.records)) return 0;
    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayAttendanceRecord.records.filter((record: any) => {
      const childId = typeof record?.child === "object" ? String(record?.child?._id) : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "absent";
    }).length;
  }, [todayAttendanceRecord, children]);

  const feedingDoneToday = useMemo(() => {
    if (!todayFeedingRecord?.records || !Array.isArray(todayFeedingRecord.records)) return 0;
    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayFeedingRecord.records.filter((record: any) => {
      const childId = typeof record?.child === "object" ? String(record?.child?._id) : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "completed";
    }).length;
  }, [todayFeedingRecord, children]);

  const onRefresh = () => { void refetch(); };

  return {
    children, selectedChild, attendanceRecords, feedingRecords,
    todayAttendanceRecord, todayFeedingRecord, recentNotifications, stats,
    presentToday, absentToday, feedingDoneToday,
    loading: isLoading, refreshing: isRefetching,
    error: error instanceof Error ? error.message : null, onRefresh,
  };
}

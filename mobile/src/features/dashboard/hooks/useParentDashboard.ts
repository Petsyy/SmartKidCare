import { useCallback, useEffect, useMemo, useState } from "react";
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
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<any[]>([]);
  const [todayAttendanceRecord, setTodayAttendanceRecord] = useState<any>(null);
  const [todayFeedingRecord, setTodayFeedingRecord] = useState<any>(null);
  const [recentNotifications, setRecentNotifications] = useState<
    ParentNotificationFeedItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) setLoading(true);
        setError(null);

        if (token) {
          const data = await getMyChildren(token);
          setChildren(data);

          // Set first child as selected if none selected
          if (!selectedChildId && data.length > 0) {
            setSelectedChildId(data[0]._id);
          }

          // Fetch attendance and feeding records
          const [
            attendance,
            feeding,
            todayAttendance,
            todayFeeding,
            parentNotifications,
          ] = await Promise.all([
            getAttendanceHistory(token),
            getFeedingHistory(token),
            getTodayAttendance(token).catch(() => null),
            getTodayFeeding(token).catch(() => null),
            getParentNotificationsFeed(token).catch(() => null),
          ]);

          setAttendanceRecords(attendance);
          setFeedingRecords(feeding);
          setTodayAttendanceRecord(todayAttendance);
          setTodayFeedingRecord(todayFeeding);

          if (parentNotifications?.notifications?.length) {
            setRecentNotifications(
              parentNotifications.notifications.slice(0, 2)
            );
          } else {
            setRecentNotifications([]);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load children");
      } finally {
        setLoading(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    [token, selectedChildId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedChild = useMemo(() => {
    if (!selectedChildId) return children[0] ?? null;
    return (
      children.find((c) => c._id === selectedChildId) ?? children[0] ?? null
    );
  }, [children, selectedChildId]);

  const stats = useMemo(() => {
    if (!selectedChild) {
      return {
        present: 0,
        absent: 0,
        mealsCompleted: 0,
        mealsMissed: 0,
      };
    }

    let present = 0;
    let absent = 0;
    let mealsCompleted = 0;
    let mealsMissed = 0;

    // Count attendance records for this child
    attendanceRecords.forEach((record: any) => {
      if (record.records && Array.isArray(record.records)) {
        record.records.forEach((r: any) => {
          const childId =
            typeof r.child === "object" ? r.child._id : r.child;
          if (childId === selectedChild._id) {
            if (r.status === "present") {
              present++;
            } else if (r.status === "absent") {
              absent++;
            }
          }
        });
      }
    });

    // Count feeding records for this child
    feedingRecords.forEach((record: any) => {
      if (record.records && Array.isArray(record.records)) {
        record.records.forEach((r: any) => {
          const childId =
            typeof r.child === "object" ? r.child._id : r.child;
          if (childId === selectedChild._id) {
            if (r.status === "completed") {
              mealsCompleted++;
            } else if (r.status === "missed") {
              mealsMissed++;
            }
          }
        });
      }
    });

    return {
      present,
      absent,
      mealsCompleted,
      mealsMissed,
    };
  }, [selectedChild, attendanceRecords, feedingRecords]);

  const presentToday = useMemo(() => {
    if (
      !todayAttendanceRecord?.records ||
      !Array.isArray(todayAttendanceRecord.records)
    ) {
      return 0;
    }

    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayAttendanceRecord.records.filter((record: any) => {
      const childId =
        typeof record?.child === "object"
          ? String(record?.child?._id)
          : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "present";
    }).length;
  }, [todayAttendanceRecord, children]);

  const absentToday = useMemo(() => {
    if (
      !todayAttendanceRecord?.records ||
      !Array.isArray(todayAttendanceRecord.records)
    ) {
      return 0;
    }

    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayAttendanceRecord.records.filter((record: any) => {
      const childId =
        typeof record?.child === "object"
          ? String(record?.child?._id)
          : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "absent";
    }).length;
  }, [todayAttendanceRecord, children]);

  const feedingDoneToday = useMemo(() => {
    if (
      !todayFeedingRecord?.records ||
      !Array.isArray(todayFeedingRecord.records)
    ) {
      return 0;
    }

    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayFeedingRecord.records.filter((record: any) => {
      const childId =
        typeof record?.child === "object"
          ? String(record?.child?._id)
          : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "completed";
    }).length;
  }, [todayFeedingRecord, children]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  return {
    children,
    selectedChild,
    attendanceRecords,
    feedingRecords,
    todayAttendanceRecord,
    todayFeedingRecord,
    recentNotifications,
    stats,
    presentToday,
    absentToday,
    feedingDoneToday,
    loading,
    refreshing,
    error,
    onRefresh,
  };
}

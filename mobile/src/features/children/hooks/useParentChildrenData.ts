import { useCallback, useMemo } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import {
  getAttendanceHistory,
  getFeedingHistory,
  getTodayAttendance,
  getTodayFeeding,
} from "@/src/api/records.api";
import { useParentChildrenStore } from "@/src/features/children/stores/parent-children.store";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export type DailyAttendance = "Present" | "Absent" | "No update yet";
export type DailyFeeding = "Finished" | "Missed" | "No update yet";

export type DailyChildStatus = {
  attendance: DailyAttendance;
  feeding: DailyFeeding;
  lastUpdated: string;
  tone: "good" | "warning" | "neutral";
};

export type MonthlySummary = {
  attendanceRate: number;
  feedingRate: number;
  attendanceDone: number;
  attendanceTotal: number;
  feedingDone: number;
  feedingTotal: number;
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const getRecordChildId = (record: any): string => {
  if (typeof record?.child === "string") return record.child;
  return record?.child?._id ? String(record.child._id) : "";
};

const formatStatusTimestamp = (rawDate: string | null): string => {
  if (!rawDate) return "Waiting for teacher update";
  const parsed = new Date(rawDate);
  return parsed.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
};

const toPercent = (done: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
};

export const useParentChildrenData = () => {
  const { isAuthenticated } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const { selectedChildId, setSelectedChildId } = useParentChildrenStore();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: mobileQueryKeys.parentChildrenDashboard(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const { startDate, endDate } = getMonthRange();
      const [
        childrenData,
        todayAttendance,
        todayFeeding,
        attendanceHistory,
        feedingHistory,
      ] = await Promise.all([
        getMyChildren(),
        getTodayAttendance().catch(() => null),
        getTodayFeeding().catch(() => null),
        getAttendanceHistory(startDate, endDate).catch(() => []),
        getFeedingHistory(startDate, endDate).catch(() => []),
      ]);
      return {
        children: childrenData,
        todayAttendanceRecord: todayAttendance,
        todayFeedingRecord: todayFeeding,
        monthAttendanceRecords: Array.isArray(attendanceHistory)
          ? attendanceHistory
          : [],
        monthFeedingRecords: Array.isArray(feedingHistory)
          ? feedingHistory
          : [],
      };
    },
  });

  const children = data?.children ?? [];
  const todayAttendanceRecord = data?.todayAttendanceRecord ?? null;
  const todayFeedingRecord = data?.todayFeedingRecord ?? null;
  const monthAttendanceRecords = data?.monthAttendanceRecords ?? [];
  const monthFeedingRecords = data?.monthFeedingRecords ?? [];

  const loadScreenData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      void loadScreenData();
    }, [loadScreenData]),
  );

  const onRefresh = () => {
    void loadScreenData();
  };

  const selectedChild = useMemo(() => {
    if (!children.length) return null;
    if (!selectedChildId) return children[0];
    return (
      children.find((child) => child._id === selectedChildId) ?? children[0]
    );
  }, [children, selectedChildId]);

  const childStatus = useMemo<DailyChildStatus>(() => {
    if (!selectedChild)
      return {
        attendance: "No update yet",
        feeding: "No update yet",
        lastUpdated: "Waiting for teacher update",
        tone: "neutral",
      };
    let attendance: DailyAttendance = "No update yet";
    let feeding: DailyFeeding = "No update yet";

    const attendanceEntry = todayAttendanceRecord?.records?.find(
      (record: any) => getRecordChildId(record) === selectedChild._id,
    );
    if (attendanceEntry)
      attendance = attendanceEntry.status === "present" ? "Present" : "Absent";

    const feedingEntry = todayFeedingRecord?.records?.find(
      (record: any) => getRecordChildId(record) === selectedChild._id,
    );
    if (feedingEntry)
      feeding = feedingEntry.status === "completed" ? "Finished" : "Missed";

    const timestampCandidates = [
      todayAttendanceRecord?.updatedAt,
      todayAttendanceRecord?.createdAt,
      todayAttendanceRecord?.date,
      todayFeedingRecord?.updatedAt,
      todayFeedingRecord?.createdAt,
      todayFeedingRecord?.date,
    ]
      .map((value) => (value ? new Date(value) : null))
      .filter((value): value is Date =>
        Boolean(value && !Number.isNaN(value.getTime())),
      );

    const latestTimestamp =
      timestampCandidates.length > 0
        ? new Date(
            Math.max(...timestampCandidates.map((value) => value.getTime())),
          )
        : null;

    let tone: DailyChildStatus["tone"] = "neutral";
    if (attendance === "Present" && feeding === "Finished") tone = "good";
    else if (attendance === "Absent" || feeding === "Missed") tone = "warning";

    return {
      attendance,
      feeding,
      lastUpdated: formatStatusTimestamp(
        latestTimestamp ? latestTimestamp.toISOString() : null,
      ),
      tone,
    };
  }, [selectedChild, todayAttendanceRecord, todayFeedingRecord]);

  const monthlySummary = useMemo<MonthlySummary>(() => {
    if (!selectedChild)
      return {
        attendanceRate: 0,
        feedingRate: 0,
        attendanceDone: 0,
        attendanceTotal: 0,
        feedingDone: 0,
        feedingTotal: 0,
      };
    let attendanceDone = 0,
      attendanceTotal = 0,
      feedingDone = 0,
      feedingTotal = 0;
    monthAttendanceRecords.forEach((record: any) => {
      if (!Array.isArray(record?.records)) return;
      record.records.forEach((entry: any) => {
        if (getRecordChildId(entry) !== selectedChild._id) return;
        attendanceTotal += 1;
        if (entry.status === "present") attendanceDone += 1;
      });
    });
    monthFeedingRecords.forEach((record: any) => {
      if (!Array.isArray(record?.records)) return;
      record.records.forEach((entry: any) => {
        if (getRecordChildId(entry) !== selectedChild._id) return;
        feedingTotal += 1;
        if (entry.status === "completed") feedingDone += 1;
      });
    });
    return {
      attendanceRate: toPercent(attendanceDone, attendanceTotal),
      feedingRate: toPercent(feedingDone, feedingTotal),
      attendanceDone,
      attendanceTotal,
      feedingDone,
      feedingTotal,
    };
  }, [selectedChild, monthAttendanceRecords, monthFeedingRecords]);

  const scrollBottomPadding = Math.max(100, tabBarHeight + 24);

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    loading: isLoading,
    refreshing: isRefetching,
    error: error instanceof Error ? error.message : null,
    loadScreenData,
    onRefresh,
    childStatus,
    monthlySummary,
    scrollBottomPadding,
  };
};

import { useCallback, useEffect, useMemo, useState } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import {
  getAttendanceHistory,
  getFeedingHistory,
  getTodayAttendance,
  getTodayFeeding,
} from "@/src/api/records.api";

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
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
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
  const { token } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [todayAttendanceRecord, setTodayAttendanceRecord] = useState<any>(null);
  const [todayFeedingRecord, setTodayFeedingRecord] = useState<any>(null);
  const [monthAttendanceRecords, setMonthAttendanceRecords] = useState<any[]>([]);
  const [monthFeedingRecords, setMonthFeedingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScreenData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) setLoading(true);
        setError(null);

        if (!token) throw new Error("No authentication token");

        const { startDate, endDate } = getMonthRange();
        const [childrenData, todayAttendance, todayFeeding, attendanceHistory, feedingHistory] = await Promise.all([
          getMyChildren(token),
          getTodayAttendance(token).catch(() => null),
          getTodayFeeding(token).catch(() => null),
          getAttendanceHistory(token, startDate, endDate).catch(() => []),
          getFeedingHistory(token, startDate, endDate).catch(() => []),
        ]);

        setChildren(childrenData);
        setTodayAttendanceRecord(todayAttendance);
        setTodayFeedingRecord(todayFeeding);
        setMonthAttendanceRecords(Array.isArray(attendanceHistory) ? attendanceHistory : []);
        setMonthFeedingRecords(Array.isArray(feedingHistory) ? feedingHistory : []);

        setSelectedChildId((prev) => {
          if (prev && childrenData.some((child) => child._id === prev)) return prev;
          return childrenData[0]?._id ?? null;
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load your children");
      } finally {
        setLoading(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadScreenData();
    }, [loadScreenData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadScreenData(true);
  };

  const selectedChild = useMemo(() => {
    if (!children.length) return null;
    if (!selectedChildId) return children[0];
    return children.find((child) => child._id === selectedChildId) ?? children[0];
  }, [children, selectedChildId]);

  const childStatus = useMemo<DailyChildStatus>(() => {
    if (!selectedChild) {
      return {
        attendance: "No update yet",
        feeding: "No update yet",
        lastUpdated: "Waiting for teacher update",
        tone: "neutral",
      };
    }

    let attendance: DailyAttendance = "No update yet";
    let feeding: DailyFeeding = "No update yet";

    const attendanceEntry = todayAttendanceRecord?.records?.find(
      (record: any) => getRecordChildId(record) === selectedChild._id,
    );
    if (attendanceEntry) {
      attendance = attendanceEntry.status === "present" ? "Present" : "Absent";
    }

    const feedingEntry = todayFeedingRecord?.records?.find(
      (record: any) => getRecordChildId(record) === selectedChild._id,
    );
    if (feedingEntry) {
      feeding = feedingEntry.status === "completed" ? "Finished" : "Missed";
    }

    const timestampCandidates = [
      todayAttendanceRecord?.updatedAt,
      todayAttendanceRecord?.createdAt,
      todayAttendanceRecord?.date,
      todayFeedingRecord?.updatedAt,
      todayFeedingRecord?.createdAt,
      todayFeedingRecord?.date,
    ]
      .map((value) => (value ? new Date(value) : null))
      .filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime())));

    const latestTimestamp =
      timestampCandidates.length > 0
        ? new Date(Math.max(...timestampCandidates.map((value) => value.getTime())))
        : null;

    let tone: DailyChildStatus["tone"] = "neutral";
    if (attendance === "Present" && feeding === "Finished") tone = "good";
    else if (attendance === "Absent" || feeding === "Missed") tone = "warning";

    return {
      attendance,
      feeding,
      lastUpdated: formatStatusTimestamp(latestTimestamp ? latestTimestamp.toISOString() : null),
      tone,
    };
  }, [selectedChild, todayAttendanceRecord, todayFeedingRecord]);

  const monthlySummary = useMemo<MonthlySummary>(() => {
    if (!selectedChild) {
      return {
        attendanceRate: 0,
        feedingRate: 0,
        attendanceDone: 0,
        attendanceTotal: 0,
        feedingDone: 0,
        feedingTotal: 0,
      };
    }

    let attendanceDone = 0;
    let attendanceTotal = 0;
    let feedingDone = 0;
    let feedingTotal = 0;

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

  const todayStateText =
    childStatus.tone === "good"
      ? "All updates received"
      : childStatus.tone === "warning"
        // ? "Needs attention today"
        // s: "Waiting for teacher update";

  const scrollBottomPadding = Math.max(100, tabBarHeight + 24);

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    loading,
    refreshing,
    error,
    loadScreenData,
    onRefresh,
    childStatus,
    monthlySummary,
    scrollBottomPadding,
  };
};

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../components/config/config.api";

export type DashboardStats = {
  totalChildren: number;
  activeChildren: number;
  totalTeachers: number;
  todayAttendanceRate: number;
  todayFeedingRate: number;
  todayExceptions: number;
};

export type ChartDataPoint = {
  day: string;
  attendance: number;
  target: number;
};

export type PieDataPoint = {
  name: string;
  value: number;
  color: string;
};

export type RecentActivity = {
  id: string;
  type: "attendance" | "feeding";
  childName: string;
  action: string;
  timestamp: string;
  sortTime: number;
  status: string;
};

export type DashboardDateMeta = {
  todayKey: string;
  attendanceKey: string;
  feedingKey: string;
};

const DEFAULT_STATS: DashboardStats = {
  totalChildren: 0,
  activeChildren: 0,
  totalTeachers: 0,
  todayAttendanceRate: 0,
  todayFeedingRate: 0,
  todayExceptions: 0,
};

const DEFAULT_DATE_META: DashboardDateMeta = {
  todayKey: "",
  attendanceKey: "",
  feedingKey: "",
};

const formatChildName = (child?: any) => {
  if (!child) return "Unknown Child";
  const firstName = child.firstName || child.first || "";
  const middleName = child.middleName || child.middle || "";
  const lastName = child.lastName || child.last || "";
  const trailing = [firstName, middleName].filter(Boolean).join(" ");
  if (lastName && trailing) return `${lastName}, ${trailing}`;
  if (lastName) return lastName;
  if (trailing) return trailing;
  return "Unknown Child";
};

const getChildId = (child: any) =>
  typeof child === "string" ? child : String(child?._id || "");

const getLocalDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRecordDateKey = (value: unknown) => {
  const d = new Date(String(value || ""));
  if (Number.isNaN(d.getTime())) return "";
  return getLocalDateKey(d);
};

const formatDateTimeManila = (value: Date) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(value);

const getLatestDateKey = (entries: any[]): string =>
  entries.reduce((latest: string, entry: any) => {
    const hasRecords =
      Array.isArray(entry?.records) && entry.records.length > 0;
    if (!hasRecords) return latest;
    const key = getRecordDateKey(entry?.date);
    if (!key) return latest;
    return !latest || key > latest ? key : latest;
  }, "");

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [pieData, setPieData] = useState<PieDataPoint[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dateMeta, setDateMeta] =
    useState<DashboardDateMeta>(DEFAULT_DATE_META);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message =
            (payload as { message?: string; error?: string }).message ||
            (payload as { message?: string; error?: string }).error ||
            `Request failed (${res.status})`;
          throw new Error(`${url}: ${message}`);
        }
        return payload;
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = getLocalDateKey(today);
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      const weekKeys = new Set<string>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        weekKeys.add(getLocalDateKey(d));
      }

      const [childrenPayload, usersPayload, attendancePayload, feedingPayload] =
        await Promise.all([
          fetchJson(`${API_BASE}/children`),
          fetchJson(`${API_BASE}/auth/users`),
          fetchJson(`${API_BASE}/records/attendance`),
          fetchJson(`${API_BASE}/records/feeding`),
        ]);

      const childrenArray = Array.isArray(childrenPayload)
        ? childrenPayload
        : [];
      const usersArray = Array.isArray((usersPayload as any)?.users)
        ? (usersPayload as any).users
        : [];
      const attendanceArray = Array.isArray(attendancePayload)
        ? attendancePayload
        : [];
      const feedingArray = Array.isArray(feedingPayload) ? feedingPayload : [];
      const latestAttendanceKey = getLatestDateKey(attendanceArray);
      const latestFeedingKey = getLatestDateKey(feedingArray);
      setDateMeta({
        todayKey,
        attendanceKey: latestAttendanceKey || todayKey,
        feedingKey: latestFeedingKey || todayKey,
      });
      const weekAttendanceArray = attendanceArray.filter((entry: any) => {
        const entryKey = getRecordDateKey(entry.date);
        return weekKeys.has(entryKey);
      });
      const childEntries: Array<[string, any]> = childrenArray.reduce(
        (acc: Array<[string, any]>, child: any) => {
          const id = String(child?._id || "");
          if (id) acc.push([id, child]);
          return acc;
        },
        [],
      );
      const childMap = new Map<string, any>(childEntries);

      const totalChildren = childrenArray.length;
      const activeChildren = childrenArray.filter(
        (c: any) => c.status === "Active",
      ).length;
      const totalTeachers = usersArray.filter(
        (u: any) => u.role === "teacher",
      ).length;

      let allAttTotal = 0;
      let allAttPresent = 0;
      attendanceArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          allAttTotal += 1;
          if (record.status === "present") allAttPresent += 1;
        });
      });

      let allFeedTotal = 0;
      let allFeedCompleted = 0;
      feedingArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          allFeedTotal += 1;
          if (record.status === "completed") allFeedCompleted += 1;
        });
      });

      const todayAttendanceRate = allAttTotal
        ? Math.round((allAttPresent / allAttTotal) * 100)
        : 0;
      const todayFeedingRate = allFeedTotal
        ? Math.round((allFeedCompleted / allFeedTotal) * 100)
        : 0;
      const todayExceptions =
        allAttTotal - allAttPresent + (allFeedTotal - allFeedCompleted);

      setStats({
        totalChildren,
        activeChildren,
        totalTeachers,
        todayAttendanceRate,
        todayFeedingRate,
        todayExceptions,
      });

      const dayMap = new Map<string, { total: number; present: number }>();
      weekAttendanceArray.forEach((entry: any) => {
        const key = getRecordDateKey(entry.date);

        if (!dayMap.has(key)) {
          dayMap.set(key, { total: 0, present: 0 });
        }
        const bucket = dayMap.get(key)!;

        entry.records?.forEach((record: any) => {
          bucket.total += 1;
          if (record.status === "present") bucket.present += 1;
        });
      });

      const chartPoints: ChartDataPoint[] = [];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = getLocalDateKey(d);
        const data = dayMap.get(key) || { total: 0, present: 0 };
        const rate = data.total
          ? Math.round((data.present / data.total) * 100)
          : 0;

        const dayName = days[d.getDay()] || `Day ${i}`;

        chartPoints.push({
          day: dayName,
          attendance: rate,
          target: 95,
        });
      }

      setChartData(chartPoints);

      const pieChartData: PieDataPoint[] = [
        {
          name: "Present",
          value: allAttPresent,
          color: "#10b981",
        },
        {
          name: "Absent",
          value: allAttTotal - allAttPresent,
          color: "#f43f5e",
        },
      ];
      setPieData(pieChartData);

      const activities: RecentActivity[] = [];

      attendanceArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          const childId = getChildId(record.child);
          const childObj =
            typeof record.child === "object"
              ? record.child
              : childMap.get(childId) || null;
          const eventTime = new Date(
            entry.updatedAt || entry.createdAt || entry.date,
          );

          activities.push({
            id: `att-${entry._id || "row"}-${childId || record._id || Math.random()}`,
            type: "attendance",
            childName: formatChildName(childObj),
            action:
              record.status === "present" ? "Checked in" : "Marked absent",
            timestamp: formatDateTimeManila(eventTime),
            sortTime: eventTime.getTime(),
            status: record.status,
          });
        });
      });

      feedingArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          const childId = getChildId(record.child);
          const childObj =
            typeof record.child === "object"
              ? record.child
              : childMap.get(childId) || null;
          const eventTime = new Date(
            entry.updatedAt || entry.createdAt || entry.date,
          );

          activities.push({
            id: `feed-${entry._id || "row"}-${childId || record._id || Math.random()}`,
            type: "feeding",
            childName: formatChildName(childObj),
            action:
              record.status === "completed" ? "Fed lunch" : "Missed lunch",
            timestamp: formatDateTimeManila(eventTime),
            sortTime: eventTime.getTime(),
            status: record.status,
          });
        });
      });

      activities.sort((a, b) => b.sortTime - a.sortTime);
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    chartData,
    pieData,
    recentActivities,
    isLoading,
    dateMeta,
    fetchDashboardData,
  };
}

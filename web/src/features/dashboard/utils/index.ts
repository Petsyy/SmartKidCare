export * from "./types";
export * from "./helpers";
export * from "./stats";
export * from "./charts";
import type { DashboardDateMeta } from "./types";
import { getLocalDateKey, getLatestDateKey, getRecordDateKey } from "./helpers";
import { computeStats } from "./stats";
import { computeChartData, computePieData } from "./charts";

export function processDashboardData(
  childrenPayload: any,
  usersPayload: any,
  attendancePayload: any
) {
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

  const childrenArray = Array.isArray(childrenPayload) ? childrenPayload : [];
  const usersArray = Array.isArray((usersPayload as any)?.users) ? (usersPayload as any).users : [];
  const attendanceArray = Array.isArray(attendancePayload) ? attendancePayload : [];

  const latestAttendanceKey = getLatestDateKey(attendanceArray);
  
  const dateMeta: DashboardDateMeta = {
    todayKey,
    attendanceKey: latestAttendanceKey || todayKey,
  };

  const weekAttendanceArray = attendanceArray.filter((entry: any) => weekKeys.has(getRecordDateKey(entry.date)));
  
  const stats = computeStats(childrenArray, usersArray, attendanceArray);
  const chartData = computeChartData(weekAttendanceArray, today);
  const pieData = computePieData(stats);

  return { stats, chartData, pieData, dateMeta };
}

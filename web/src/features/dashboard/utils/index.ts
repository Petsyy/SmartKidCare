export * from "./types";
export * from "./helpers";
export * from "./stats";
export * from "./charts";
export * from "./activities";

import type { DashboardDateMeta } from "./types";
import { getLocalDateKey, getLatestDateKey, getRecordDateKey } from "./helpers";
import { computeStats } from "./stats";
import { computeChartData, computePieData } from "./charts";
import { computeRecentActivities } from "./activities";

export function processDashboardData(
  childrenPayload: any,
  usersPayload: any,
  attendancePayload: any,
  feedingPayload: any,
  centersPayload: any
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
  const feedingArray = Array.isArray(feedingPayload) ? feedingPayload : [];
  const centersArray = Array.isArray((centersPayload as any)?.centers) ? (centersPayload as any).centers : [];

  const latestAttendanceKey = getLatestDateKey(attendanceArray);
  const latestFeedingKey = getLatestDateKey(feedingArray);
  
  const dateMeta: DashboardDateMeta = {
    todayKey,
    attendanceKey: latestAttendanceKey || todayKey,
    feedingKey: latestFeedingKey || todayKey,
  };

  const weekAttendanceArray = attendanceArray.filter((entry: any) => weekKeys.has(getRecordDateKey(entry.date)));
  const weekFeedingArray = feedingArray.filter((entry: any) => weekKeys.has(getRecordDateKey(entry.date)));
  
  const childEntries: Array<[string, any]> = childrenArray.reduce((acc: Array<[string, any]>, child: any) => {
    const id = String(child?._id || "");
    if (id) acc.push([id, child]);
    return acc;
  }, []);
  const childMap = new Map<string, any>(childEntries);

  const stats = computeStats(childrenArray, usersArray, centersArray, attendanceArray, feedingArray);
  const chartData = computeChartData(weekAttendanceArray, weekFeedingArray, today);
  const pieData = computePieData(stats);
  const recentActivities = computeRecentActivities(attendanceArray, feedingArray, childMap, usersArray, centersArray);

  return { stats, chartData, pieData, recentActivities, dateMeta };
}

import type {
  ChartDataPoint,
  DashboardStats,
  EnrollmentDataPoint,
} from "./types";
import { getRecordDateKey, getLocalDateKey } from "./helpers";

export function computeChartData(
  weekAttendanceArray: any[],
  today: Date
): ChartDataPoint[] {
  const dayMap = new Map<
    string,
    {
      attendanceTotal: number;
      attendancePresent: number;
    }
  >();

  weekAttendanceArray.forEach((entry: any) => {
    const key = getRecordDateKey(entry.date);
    if (!dayMap.has(key)) {
      dayMap.set(key, { attendanceTotal: 0, attendancePresent: 0 });
    }
    const bucket = dayMap.get(key)!;
    entry.records?.forEach((record: any) => {
      bucket.attendanceTotal += 1;
      if (record.status === "present") bucket.attendancePresent += 1;
    });
  });

  const chartPoints: ChartDataPoint[] = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = getLocalDateKey(d);

    const data = dayMap.get(key) || {
      attendanceTotal: 0, attendancePresent: 0,
    };

    const attendanceRate = data.attendanceTotal
      ? Math.round((data.attendancePresent / data.attendanceTotal) * 100)
      : 0;
    const dayName = days[d.getDay()] || `Day ${i}`;
    chartPoints.push({ day: dayName, attendance: attendanceRate });
  }

  return chartPoints;
}

export function computeEnrollmentData(
  stats: DashboardStats,
): EnrollmentDataPoint[] {
  return [
    {
      name: "Boys",
      regular: stats.boysRegular,
      fourPs: stats.boysFourPs,
    },
    {
      name: "Girls",
      regular: stats.girlsRegular,
      fourPs: stats.girlsFourPs,
    },
  ];
}

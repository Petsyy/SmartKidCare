import type { ChartDataPoint, PieDataPoint, DashboardStats } from "./types";
import { getRecordDateKey, getLocalDateKey } from "./helpers";

export function computeChartData(
  weekAttendanceArray: any[],
  weekFeedingArray: any[],
  today: Date
): ChartDataPoint[] {
  const dayMap = new Map<
    string,
    {
      attendanceTotal: number;
      attendancePresent: number;
      feedingTotal: number;
      feedingCompleted: number;
    }
  >();

  weekAttendanceArray.forEach((entry: any) => {
    const key = getRecordDateKey(entry.date);
    if (!dayMap.has(key)) {
      dayMap.set(key, { attendanceTotal: 0, attendancePresent: 0, feedingTotal: 0, feedingCompleted: 0 });
    }
    const bucket = dayMap.get(key)!;
    entry.records?.forEach((record: any) => {
      bucket.attendanceTotal += 1;
      if (record.status === "present") bucket.attendancePresent += 1;
    });
  });

  weekFeedingArray.forEach((entry: any) => {
    const key = getRecordDateKey(entry.date);
    if (!dayMap.has(key)) {
      dayMap.set(key, { attendanceTotal: 0, attendancePresent: 0, feedingTotal: 0, feedingCompleted: 0 });
    }
    const bucket = dayMap.get(key)!;
    entry.records?.forEach((record: any) => {
      bucket.feedingTotal += 1;
      if (record.status === "completed") bucket.feedingCompleted += 1;
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
      attendanceTotal: 0, attendancePresent: 0, feedingTotal: 0, feedingCompleted: 0,
    };

    const attendanceRate = data.attendanceTotal
      ? Math.round((data.attendancePresent / data.attendanceTotal) * 100)
      : 0;
    const feedingRate = data.feedingTotal
      ? Math.round((data.feedingCompleted / data.feedingTotal) * 100)
      : 0;

    const dayName = days[d.getDay()] || `Day ${i}`;
    chartPoints.push({ day: dayName, attendance: attendanceRate, feeding: feedingRate });
  }

  return chartPoints;
}

export function computePieData(stats: DashboardStats): PieDataPoint[] {
  return [
    {
      name: "Total Child Development Centers",
      value: stats.totalChildDevelopmentCenters,
      color: "#38bdf8",
    },
    {
      name: "Child Development Workers",
      value: stats.childDevelopmentWorkers,
      color: "#14b8a6",
    },
    {
      name: "Total Enrolled Daycares",
      value: stats.totalEnrolledDaycares,
      color: "#f59e0b",
    },
    {
      name: "4P's Beneficiaries",
      value: stats.fourPsBeneficiaries,
      color: "#f43f5e",
    },
    {
      name: "Regular Attendees",
      value: stats.regularAttendees,
      color: "#6366f1",
    },
  ];
}

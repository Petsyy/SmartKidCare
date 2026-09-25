import { useQuery } from "@tanstack/react-query";
import { apiRequestOrThrow } from "@/api/api-client";
import { getNutritionAnalytics } from "@/api/nutrition.api";
import { webQueryKeys } from "@/lib/query-keys";
import { computePieData } from "../utils";
import {
  DEFAULT_DATE_META,
  DEFAULT_STATS,
  type ChartDataPoint,
  type DashboardDateMeta,
  type DashboardStats,
  type PieDataPoint,
} from "../utils";
import { getManilaDateKey, shiftDateKey } from "../utils";

type DashboardReport = {
  summary: {
    totalChildDevelopmentCenters: number;
    childDevelopmentWorkers: number;
    totalEnrolledChildren: number;
    fourPsBeneficiaries: number;
    regularAttendees: number;
    activeChildren: number;
    attendanceRate: number;
    feedingRate: number;
  };
  recentDailyRows: Array<{
    dateKey: string;
    attendanceRate: number;
    feedingRate: number;
    present: number;
    absent: number;
    completed: number;
    missed: number;
  }>;
  lastUpdatedAt: string;
};

export type { DashboardStats, ChartDataPoint, PieDataPoint, DashboardDateMeta };

const dayLabel = (dateKey: string) =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(`${dateKey}T00:00:00+08:00`));

export function useAdminDashboard() {
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: webQueryKeys.adminDashboard(),
    queryFn: async () => {
      const [report, nutrition] = await Promise.all([
        apiRequestOrThrow<DashboardReport>(
          "/reports/admin-analytics?datePreset=7d&limit=1",
          "Failed to load dashboard analytics",
        ),
        getNutritionAnalytics({}),
      ]);

      const todayKey = getManilaDateKey(new Date());
      const today = report.recentDailyRows.find(
        (row) => row.dateKey === todayKey,
      );
      const todayAttendanceTotal = (today?.present ?? 0) + (today?.absent ?? 0);
      const todayFeedingTotal = (today?.completed ?? 0) + (today?.missed ?? 0);
      const hasTodayAttendance = todayAttendanceTotal > 0;
      const hasTodayFeeding = todayFeedingTotal > 0;
      const stats: DashboardStats = {
        ...DEFAULT_STATS,
        totalChildDevelopmentCenters: report.summary.totalChildDevelopmentCenters,
        childDevelopmentWorkers: report.summary.childDevelopmentWorkers,
        totalEnrolledDaycares: report.summary.totalEnrolledChildren,
        totalChildren: report.summary.totalEnrolledChildren,
        activeChildren: report.summary.activeChildren,
        totalTeachers: report.summary.childDevelopmentWorkers,
        fourPsBeneficiaries: report.summary.fourPsBeneficiaries,
        regularAttendees: report.summary.regularAttendees,
        todayAttendanceRate: hasTodayAttendance ? today?.attendanceRate ?? null : null,
        todayFeedingRate: hasTodayFeeding ? today?.feedingRate ?? null : null,
        hasTodayAttendance,
        hasTodayFeeding,
        todayAbsentCount: today?.absent ?? 0,
        todayMissedCount: today?.missed ?? 0,
        todayExceptions: (today?.absent ?? 0) + (today?.missed ?? 0),
        underweightCount: nutrition.underweightCount,
        severelyUnderweightCount: nutrition.severelyUnderweightCount,
        normalCount: nutrition.normalCount,
        overweightCount: nutrition.overweightCount,
        obeseCount: nutrition.obeseCount,
      };

      const rowsByDate = new Map(
        report.recentDailyRows.map((row) => [row.dateKey, row]),
      );
      const chartData = Array.from({ length: 7 }, (_, index) => {
        const dateKey = shiftDateKey(todayKey, index - 6);
        const row = rowsByDate.get(dateKey);
        const attendanceTotal = (row?.present ?? 0) + (row?.absent ?? 0);
        const feedingTotal = (row?.completed ?? 0) + (row?.missed ?? 0);
        return {
          day: dayLabel(dateKey),
          attendance: attendanceTotal > 0 ? row?.attendanceRate ?? null : null,
          feeding: feedingTotal > 0 ? row?.feedingRate ?? null : null,
        };
      });

      return {
        stats,
        chartData,
        pieData: computePieData(stats),
        dateMeta: {
          todayKey,
          attendanceKey: hasTodayAttendance ? todayKey : "",
          feedingKey: hasTodayFeeding ? todayKey : "",
        },
        serverUpdatedAt: report.lastUpdatedAt,
      };
    },
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? "Unable to load dashboard data."
        : null;

  return {
    stats: data?.stats ?? DEFAULT_STATS,
    chartData: data?.chartData ?? [],
    pieData: data?.pieData ?? [],
    isLoading,
    isRefreshing: isFetching && !isLoading,
    hasData: Boolean(data),
    error,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    dateMeta: data?.dateMeta ?? DEFAULT_DATE_META,
    fetchDashboardData: refetch,
  };
}

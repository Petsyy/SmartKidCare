import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services";
import { nutritionService } from "@/features/children";
import { webQueryKeys } from "@/lib/query-keys";
import { computeEnrollmentData, DEFAULT_DATE_META, DEFAULT_STATS, getManilaDateKey, shiftDateKey } from "../utils";
import type {
  DashboardStats,
} from "../types";

export type {
  DashboardStats,
  ChartDataPoint,
  EnrollmentDataPoint,
  DashboardDateMeta,
} from "../types";

const dayLabel = (dateKey: string, preset: "7d" | "30d") =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: preset === "7d" ? "short" : undefined,
    day: preset === "30d" ? "numeric" : undefined,
    month: preset === "30d" ? "short" : undefined,
    timeZone: "Asia/Manila",
  }).format(new Date(`${dateKey}T00:00:00+08:00`));

export function useAdminDashboard(datePreset: "7d" | "30d" = "7d") {
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: [...webQueryKeys.adminDashboard(), datePreset],
    queryFn: async () => {
      const [report, nutrition] = await Promise.all([
        dashboardService.getDashboardAnalytics(datePreset),
        nutritionService.getNutritionAnalytics({}),
      ]);

      const todayKey = getManilaDateKey(new Date());
      const today = report.recentDailyRows.find(
        (row) => row.dateKey === todayKey,
      );
      const todayAttendanceTotal = (today?.present ?? 0) + (today?.absent ?? 0);
      const hasTodayAttendance = todayAttendanceTotal > 0;
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
        hasTodayAttendance,
        todayAbsentCount: today?.absent ?? 0,
        todayPresentCount: today?.present ?? 0,
        todayExceptions: today?.absent ?? 0,
        underweightCount: nutrition.underweightCount,
        severelyUnderweightCount: nutrition.severelyUnderweightCount,
        normalCount: nutrition.normalCount,
        overweightCount: nutrition.overweightCount,
        obeseCount: nutrition.obeseCount,
        boys: report.demographics?.genderBreakdown?.male ?? 0,
        girls: report.demographics?.genderBreakdown?.female ?? 0,
        boysFourPs:
          report.demographics?.programBreakdownByGender?.male.fourPs ?? 0,
        boysRegular:
          report.demographics?.programBreakdownByGender?.male.regular ?? 0,
        girlsFourPs:
          report.demographics?.programBreakdownByGender?.female.fourPs ?? 0,
        girlsRegular:
          report.demographics?.programBreakdownByGender?.female.regular ?? 0,
      };

      const rowsByDate = new Map(
        report.recentDailyRows.map((row) => [row.dateKey, row]),
      );
      const daysCount = datePreset === "30d" ? 30 : 7;
      const chartData = Array.from({ length: daysCount }, (_, index) => {
        const dateKey = shiftDateKey(todayKey, index - (daysCount - 1));
        const row = rowsByDate.get(dateKey);
        const attendanceTotal = (row?.present ?? 0) + (row?.absent ?? 0);
        return {
          day: dayLabel(dateKey, datePreset),
          attendance: attendanceTotal > 0 ? row?.attendanceRate ?? null : null,
        };
      });

      return {
        stats,
        chartData,
        enrollmentData: computeEnrollmentData(stats),
        dateMeta: {
          todayKey,
          attendanceKey: hasTodayAttendance ? todayKey : "",
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
    enrollmentData: data?.enrollmentData ?? [],
    isLoading,
    isRefreshing: isFetching && !isLoading,
    hasData: Boolean(data),
    error,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    dateMeta: data?.dateMeta ?? DEFAULT_DATE_META,
    fetchDashboardData: refetch,
  };
}

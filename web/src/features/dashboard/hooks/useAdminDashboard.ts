import { useMemo } from "react";
import { API_BASE } from "@/api/config";
import { useQuery } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";
import {
  processDashboardData,
  DEFAULT_STATS,
  DEFAULT_DATE_META,
  type DashboardStats,
  type ChartDataPoint,
  type PieDataPoint,
  type RecentActivity,
  type DashboardDateMeta,
} from "../utils";

export type {
  DashboardStats,
  ChartDataPoint,
  PieDataPoint,
  RecentActivity,
  DashboardDateMeta,
};

export function useAdminDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: webQueryKeys.adminDashboard(),
    queryFn: async () => {
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

      const [
        childrenPayload,
        usersPayload,
        attendancePayload,
        feedingPayload,
        centersPayload,
      ] = await Promise.all([
        fetchJson(`${API_BASE}/children`),
        fetchJson(`${API_BASE}/auth/users`),
        fetchJson(`${API_BASE}/records/attendance`),
        fetchJson(`${API_BASE}/records/feeding`),
        fetchJson(`${API_BASE}/admin/daycare-centers`),
      ]);

      return processDashboardData(
        childrenPayload,
        usersPayload,
        attendancePayload,
        feedingPayload,
        centersPayload
      );
    },
  });

  const stats = data?.stats ?? DEFAULT_STATS;
  const chartData = data?.chartData ?? [];
  const pieData = data?.pieData ?? [];
  const recentActivities = data?.recentActivities ?? [];
  const dateMeta = data?.dateMeta ?? DEFAULT_DATE_META;
  const fetchDashboardData = useMemo(() => refetch, [refetch]);

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

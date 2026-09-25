import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatsGrid } from "@/features/dashboard/components/StatsGrid";
import { AttendanceChart } from "@/features/dashboard/components/AttendanceChart";
import { EnrollmentPieChart } from "@/features/dashboard/components/EnrollmentPieChart";
import { useAdminDashboard } from "@/features/dashboard/hooks/useAdminDashboard";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { formatDateTimeManila } from "@/utils/formatters";
import { RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const { settings } = useSystemSettings();
  const navigate = useNavigate();
  const {
    stats,
    chartData,
    pieData,
    isLoading,
    isRefreshing,
    hasData,
    error,
    lastUpdatedAt,
    fetchDashboardData,
  } = useAdminDashboard();

  return (
    <Layout
      activeItem="monitoring/dashboard"
      breadcrumbs={["Barangay Captain", "Dashboard"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageHeader
              title="Dashboard"
              subtitle={`Welcome to ${settings?.schoolName || "Smart KidCare"} Monitoring System`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {lastUpdatedAt
                ? `Last updated ${formatDateTimeManila(lastUpdatedAt)}`
                : "Waiting for the first successful update"}
            </p>
          </div>
          <Button
            onClick={() => void fetchDashboardData()}
            disabled={isRefreshing}
            icon={
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            }
          >
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>

        {error && <ErrorAlert message={error} />}

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCardSkeleton color="blue" />
              <StatCardSkeleton color="teal" />
              <StatCardSkeleton color="purple" />
              <StatCardSkeleton color="rose" />
              <StatCardSkeleton color="blue" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2 mt-6">
              <Skeleton className="h-100 w-full" />
              <Skeleton className="h-100 w-full" />
            </div>
          </>
        ) : !hasData ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-medium text-gray-800 dark:text-slate-100">
              Dashboard data is unavailable.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Check the connection, then try loading the dashboard again.
            </p>
            <Button
              className="mt-4"
              onClick={() => void fetchDashboardData()}
              loading={isRefreshing}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <StatsGrid stats={stats} onNavigate={navigate} />

            <div className="grid gap-4 lg:grid-cols-2">
              <AttendanceChart data={chartData} />
              <EnrollmentPieChart data={pieData} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

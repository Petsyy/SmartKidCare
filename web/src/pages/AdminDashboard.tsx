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

export default function AdminDashboard() {
  const { settings } = useSystemSettings();
  const navigate = useNavigate();
  const { stats, chartData, pieData, isLoading } =
    useAdminDashboard();

  return (
    <Layout
      activeItem="dashboard"
      breadcrumbs={["Admin", "Dashboard"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome to ${settings?.schoolName || "Smart KidCare"} Monitoring System`}
        />

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
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </>
        ) : (
          <>
            <StatsGrid stats={stats} />

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

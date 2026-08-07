import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatsGrid } from "@/features/dashboard/components/StatsGrid";
import { AttendanceChart } from "@/features/dashboard/components/AttendanceChart";
import { EnrollmentPieChart } from "@/features/dashboard/components/EnrollmentPieChart";
import { RecentActivityTable } from "@/features/dashboard/components/RecentActivityTable";
import { useAdminDashboard } from "@/features/dashboard/hooks/useAdminDashboard";
import { useSystemSettings } from "@/context/SystemSettingsContext";

export default function AdminDashboard() {
  const { settings } = useSystemSettings();
  const navigate = useNavigate();
  const { stats, chartData, pieData, recentActivities, isLoading } =
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
          <LoadingState message="Loading dashboard..." />
        ) : (
          <>
            <StatsGrid stats={stats} />

            <div className="grid gap-4 lg:grid-cols-2">
              <AttendanceChart data={chartData} />
              <EnrollmentPieChart data={pieData} />
            </div>

            <RecentActivityTable activities={recentActivities} />
          </>
        )}
      </div>
    </Layout>
  );
}

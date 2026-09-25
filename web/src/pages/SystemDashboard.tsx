import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, GraduationCap, Users, Building2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { apiRequestOrThrow } from "@/api/api-client";

type Overview = {
  barangay_captainActive: number; barangay_captainInactive: number;
  teacherActive: number; teacherInactive: number;
  parentActive: number; parentInactive: number;
  center: { name: string; isActive?: boolean };
};

export default function SystemDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["systemOverview"],
    queryFn: () => apiRequestOrThrow<Overview>("/admin/system-overview", "Failed to load system overview"),
  });
  return (
    <Layout activeItem="system/dashboard" breadcrumbs={["System Admin", "Dashboard"]} onNavigate={(path) => navigate(`/${path}`)}>
      <div className="space-y-6 p-8">
        <PageHeader title="System Dashboard" subtitle="Account and platform status for Bonuan Sabangan" />
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} color="teal" />) : <>
            <StatCard title="Barangay Captains" value={String(data?.barangay_captainActive ?? 0)} subtitle={`${data?.barangay_captainInactive ?? 0} inactive`} icon={ShieldCheck} color="teal" />
            <StatCard title="Child Development Workers" value={String(data?.teacherActive ?? 0)} subtitle={`${data?.teacherInactive ?? 0} inactive`} icon={GraduationCap} color="blue" />
            <StatCard title="Parent Accounts" value={String(data?.parentActive ?? 0)} subtitle={`${data?.parentInactive ?? 0} inactive`} icon={Users} color="purple" />
            <StatCard title="Center Status" value={data?.center?.isActive === false ? "Inactive" : "Active"} subtitle={data?.center?.name || "Bonuan Sabangan"} icon={Building2} color="rose" />
          </>}
        </div>
      </div>
    </Layout>
  );
}

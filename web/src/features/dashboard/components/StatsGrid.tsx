import { Home, Users, UserCircle, Heart, Smile } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { DashboardStats } from "../hooks/useAdminDashboard";

type StatsGridProps = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Total Child Development Centers"
        value={String(stats.totalChildDevelopmentCenters)}
        subtitle="Active centers"
        icon={Home}
        color="blue"
      />
      <StatCard
        title="Child Development Workers"
        value={String(stats.childDevelopmentWorkers)}
        subtitle="Active teacher accounts"
        icon={Users}
        color="teal"
      />
      <StatCard
        title="Total Enrolled Children"
        value={String(stats.totalEnrolledDaycares)}
        subtitle="Total enrolled children"
        icon={UserCircle}
        color="purple"
      />
      <StatCard
        title="4P's Beneficiaries"
        value={String(stats.fourPsBeneficiaries)}
        subtitle="Children under 4Ps program"
        icon={Heart}
        color="rose"
      />
      <StatCard
        title="Regular Attendees"
        value={String(stats.regularAttendees)}
        subtitle="Non-beneficiary enrollees"
        icon={Smile}
        color="blue"
      />
    </div>
  );
}

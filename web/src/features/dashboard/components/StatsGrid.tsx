import {
  Activity,
  AlertTriangle,
  Heart,
  UserCircle,
  UsersRound,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { DashboardStats } from "../hooks/useAdminDashboard";

type StatsGridProps = {
  stats: DashboardStats;
  onNavigate: (path: string) => void;
};

export function StatsGrid({ stats, onNavigate }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Total Enrolled Children"
        value={String(stats.totalEnrolledDaycares)}
        subtitle="Basis for meal and supply allocation"
        icon={UserCircle}
        color="blue"
        onClick={() => onNavigate("/monitoring/records")}
        accessibilityLabel="Open daycare records for all enrolled children"
      />
      <StatCard
        title="Underweight"
        value={String(stats.underweightCount)}
        subtitle="Priority for feeding support"
        icon={Activity}
        color="purple"
        onClick={() => onNavigate("/monitoring/reports/nutrition")}
        accessibilityLabel="Open health and nutrition analytics for underweight children"
      />
      <StatCard
        title="Severely Underweight"
        value={String(stats.severelyUnderweightCount)}
        subtitle="Highest priority nutrition cases"
        icon={AlertTriangle}
        color="rose"
        onClick={() => onNavigate("/monitoring/reports/nutrition")}
        accessibilityLabel="Open health and nutrition analytics for severely underweight children"
      />
      <StatCard
        title="4P's Beneficiaries"
        value={String(stats.fourPsBeneficiaries)}
        subtitle="Children under assistance tracking"
        icon={Heart}
        color="blue"
        onClick={() => onNavigate("/monitoring/reports/overview")}
        accessibilityLabel="Open reports for 4Ps beneficiaries"
      />
      <StatCard
        title="Regular Attendees"
        value={String(stats.regularAttendees)}
        subtitle="Regular enrollees without 4Ps assistance"
        icon={UsersRound}
        color="teal"
        onClick={() => onNavigate("/monitoring/reports/overview")}
        accessibilityLabel="Open reports for regular attendees"
      />
    </div>
  );
}

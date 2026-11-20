import { School, UserCheck, UserX, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";

export interface ChildrenStatsGridProps {
  isLoading: boolean;
  stats: {
    totalChildren: number;
    active: number;
    inactive: number;
    unassigned: number;
  };
}

export function ChildrenStatsGrid({ isLoading, stats }: ChildrenStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {isLoading ? (
        <>
          <StatCardSkeleton color="blue" />
          <StatCardSkeleton color="teal" />
          <StatCardSkeleton color="rose" />
          <StatCardSkeleton color="purple" />
        </>
      ) : (
        <>
          <StatCard
            title="Total enrollment"
            value={String(stats.totalChildren)}
            subtitle={`${stats.active} active students`}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active"
            value={String(stats.active)}
            subtitle="Currently marked as Active"
            icon={UserCheck}
            color="teal"
          />
          <StatCard
            title="Inactive"
            value={String(stats.inactive)}
            subtitle="Currently marked as Inactive"
            icon={UserX}
            color="rose"
          />
          <StatCard
            title="Unassigned"
            value={String(stats.unassigned)}
            subtitle="Without an assigned teacher"
            icon={School}
            color="purple"
          />
        </>
      )}
    </div>
  );
}


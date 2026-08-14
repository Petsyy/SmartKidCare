import { Card, CardContent } from "./Card";
import { Skeleton } from "./Skeleton";

interface StatCardSkeletonProps {
  color?: "blue" | "teal" | "purple" | "rose";
}

const colorMap = {
  blue: "bg-blue-50 dark:bg-blue-500/15",
  teal: "bg-teal-50 dark:bg-teal-500/15",
  purple: "bg-purple-50 dark:bg-purple-500/15",
  rose: "bg-rose-50 dark:bg-rose-500/15",
};

export function StatCardSkeleton({ color = "teal" }: StatCardSkeletonProps) {
  return (
    <Card className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardContent className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
          <Skeleton className="h-6 w-6 rounded-md bg-white/50 dark:bg-black/20" />
        </div>
      </CardContent>
    </Card>
  );
}

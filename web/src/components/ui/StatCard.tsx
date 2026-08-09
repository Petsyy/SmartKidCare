import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./Card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: "blue" | "teal" | "purple" | "rose";
}

const colorMap: Record<StatCardProps["color"], string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardContent className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-slate-100">{value}</p>
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
import { Clock } from "lucide-react";
import type { RecentActivity } from "../hooks/useAdminDashboard";

type RecentActivityTableProps = {
  activities: RecentActivity[];
};

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-50">
            Recent Activity
          </h3>
          <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
            Latest attendance and feeding records
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-emerald-600/60 dark:text-emerald-400/60">
          No recent activity
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-emerald-50 dark:border-emerald-900/30">
          <table className="min-w-full divide-y divide-emerald-100 dark:divide-emerald-900/50">
            <thead className="bg-emerald-50/50 dark:bg-emerald-900/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Child
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Teacher
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Center
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 bg-white dark:divide-emerald-900/30 dark:bg-slate-900">
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                >
                  {/* ACTIVITY TYPE */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium capitalize text-gray-800 dark:text-slate-200">
                      {activity.type}
                    </span>
                  </td>
                  
                  {/* CHILD */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800 dark:text-slate-200">
                      {activity.childName}
                    </div>
                  </td>

                  {/* TEACHER */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-slate-400">
                      {activity.teacherName}
                    </div>
                  </td>

                  {/* CENTER */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-slate-400">
                      {activity.centerName}
                    </div>
                  </td>

                  {/* TIME */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-600 dark:text-slate-400">
                      {activity.timestamp}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        activity.status === "present" ||
                        activity.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          activity.status === "present" ||
                          activity.status === "completed"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="capitalize">{activity.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

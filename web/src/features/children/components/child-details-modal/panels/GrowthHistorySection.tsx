import { Loader2, TrendingUp } from "lucide-react";
import type { Child } from "@/types/child";
import { useChildNutrition } from "../../../hooks/useChildNutrition";
import {
  formatDate,
  formatMetric,
  getNutritionalStatusColor,
} from "../utils";

interface GrowthHistorySectionProps {
  child: Child;
  tabId: string;
}

export function GrowthHistorySection({
  child,
  tabId,
}: GrowthHistorySectionProps) {
  const { data: records = [], isLoading } = useChildNutrition(child._id);

  // Filter out drafts and sort from newest to oldest
  const submittedRecords = records
    .filter((r) => r.status === "submitted")
    .sort(
      (a, b) =>
        new Date(b.measurementDate).getTime() -
        new Date(a.measurementDate).getTime(),
    );

  const getRecordTitle = (period: string) => {
    switch (period) {
      case "initial":
        return "Initial / Enrollment";
      case "quarterly":
        return "Quarterly Assessment";
      case "final":
        return "Final Assessment";
      default:
        return "Assessment";
    }
  };

  return (
    <div
      id="growth-history-panel"
      role="tabpanel"
      aria-labelledby={tabId}
      className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
    >
      <div className="rounded-3xl border border-gray-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-teal-600 dark:text-teal-400" />
          <p className="text-base font-bold tracking-[-0.01em] text-gray-900 dark:text-slate-100">
            Growth History Timeline
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-teal-600" />
            <span className="ml-3 text-sm font-medium text-gray-500">
              Loading history...
            </span>
          </div>
        ) : submittedRecords.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No nutritional assessments recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
                  >
                    Date & Assessment
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
                  >
                    Weight
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
                  >
                    Height
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
                  >
                    BMI
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                {submittedRecords.map((record) => (
                  <tr
                    key={record._id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {getRecordTitle(record.period)}
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-400">
                        {formatDate(record.measurementDate)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-slate-200">
                      {formatMetric(record.weight, "kg")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-slate-200">
                      {formatMetric(record.height, "cm")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-slate-200">
                      {formatMetric(record.bmi)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getNutritionalStatusColor(record.nutritionalStatus)}`}
                      >
                        {record.nutritionalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

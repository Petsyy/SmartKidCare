import type { TrendPoint } from "@/features/reports/hooks/useReportAnalytics";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PH");
const formatNumber = (value: number) => NUMBER_FORMATTER.format(value);

export const ReportsDailySummaryTable = ({ recentDailyRows }: { recentDailyRows: TrendPoint[] }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
          Recent Daily Summary
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Snapshot of the latest days in the selected range.
        </p>
      </div>
      {recentDailyRows.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500 dark:text-slate-400">
          No daily summaries available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Attendance Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Feeding Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Present / Absent
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Completed / Missed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {recentDailyRows.map((row) => (
                <tr
                  key={row.dateKey}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                    {new Intl.DateTimeFormat("en-PH", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      timeZone: "Asia/Manila",
                    }).format(new Date(row.dateKey))}
                  </td>
                  <td className="px-4 py-3 text-right text-teal-700 dark:text-teal-400">
                    {row.attendanceRate}%
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                    {row.feedingRate}%
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-300">
                    {formatNumber(row.present)} / {formatNumber(row.absent)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-300">
                    {formatNumber(row.completed)} / {formatNumber(row.missed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

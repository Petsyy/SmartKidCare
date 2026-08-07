import { Eye, Pencil, Trash2 } from "lucide-react";
import type { FeedingRow } from "@/features/feeding/hooks/useFeedingProgram";
import { FeedingStatusBadge } from "./FeedingStatusBadge";

type FeedingTableProps = {
  isLoading: boolean;
  rows: FeedingRow[];
  onViewRecord: (id: string) => void;
  onEditRecord: (id: string, status: FeedingRow["status"]) => void;
  onDeleteRecord: (id: string) => void;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-PH", {
    month: "numeric",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
  });

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        month: "numeric",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Manila",
      })
    : "-";

export function FeedingTable({
  isLoading,
  rows,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
}: FeedingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-205 border-collapse lg:min-w-0">
        <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/50">
          <tr>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Child ID
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Child Name
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Date
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Food Served
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Feeding Status
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Recorded By
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Submitted At
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {isLoading ? (
            <tr>
              <td
                colSpan={8}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                Loading feeding records...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                No feeding records found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-slate-100">
                  {row.studentId || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {row.childName || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100">
                  {formatDate(row.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {row.foodServed || "-"}
                </td>
                <td className="px-6 py-4">
                  <FeedingStatusBadge status={row.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {row.teacherName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {formatDateTime(row.submittedAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-nowrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onViewRecord(row.id)}
                      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40 sm:px-3"
                      title="View"
                    >
                      <Eye
                        size={14}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditRecord(row.id, row.status)}
                      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 sm:px-3"
                      title="Edit"
                    >
                      <Pencil
                        size={14}
                        className="transition-transform duration-200 group-hover:-rotate-6"
                      />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(row.id)}
                      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40 sm:px-3"
                      title="Delete"
                    >
                      <Trash2
                        size={14}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

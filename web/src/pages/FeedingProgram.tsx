import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import {
  useFeedingProgram,
  type DatePreset,
  type FeedingStatusFilter,
  type VerificationFilter,
} from "@/hooks/useFeedingProgram";

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
    : "—";

export default function FeedingProgram() {
  const navigate = useNavigate();
  const {
    rows,
    search,
    datePreset,
    statusFilter,
    verificationFilter,
    page,
    limit,
    totalPages,
    isLoading,
    error,
    rangeLabel,
    hasActiveFilters,
    setPage,
    setLimit,
    updateSearch,
    updateDatePreset,
    updateStatusFilter,
    updateVerificationFilter,
    clearFilters,
  } = useFeedingProgram();

  return (
    <Layout
      activeItem="feeding"
      breadcrumbs={["Admin", "Feeding Program"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-50">
            Feeding Program
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Review daily feeding submissions and meal details from teachers.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Daily Feeding Logs
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Search by student, meal, or filter by date range to find
                specific records.
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search by name, meal, or ID"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "today", "thisWeek", "thisMonth"] as DatePreset[]).map(
                (preset) => {
                  const isActive = datePreset === preset;
                  const label =
                    preset === "all"
                      ? "All Dates"
                      : preset === "today"
                        ? "Today"
                        : preset === "thisWeek"
                          ? "This Week"
                          : "This Month";

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateDatePreset(preset)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200"
                          : "border-gray-300 bg-white text-gray-600 hover:border-teal-200 hover:text-teal-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                },
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) =>
                  updateStatusFilter(event.target.value as FeedingStatusFilter)
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
              <select
                value={verificationFilter}
                onChange={(event) =>
                  updateVerificationFilter(
                    event.target.value as VerificationFilter,
                  )
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Needs Review</option>
              </select>
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Child Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Food Served
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Feeding Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Recorded By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Submitted At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
                    >
                      Loading feeding records...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
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
                        {row.studentId || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">
                        {row.childName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {row.foodServed || "—"}
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-slate-700">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
              <span>{rangeLabel}</span>
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={isLoading || page <= 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Page {totalPages === 0 ? 0 : page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) =>
                    totalPages > 0 ? Math.min(totalPages, prev + 1) : prev,
                  )
                }
                disabled={isLoading || page >= totalPages}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FeedingStatusBadge({ status }: { status: "completed" | "missed" }) {
  const isCompleted = status === "completed";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isCompleted
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
      }`}
    >
      {isCompleted ? "Completed" : "Missed"}
    </span>
  );
}

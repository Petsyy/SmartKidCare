import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CircleX,
  Eye,
  Gauge,
  Pencil,
  Search,
  Trash2,
  Utensils,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import {
  useFeedingProgram,
  type DatePreset,
  type FeedingStatusFilter,
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
    startDate,
    endDate,
    statusFilter,
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
    updateDateRange,
    updateStatusFilter,
    clearFilters,
    updateFeedingStatus,
    deleteFeeding,
  } = useFeedingProgram();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [teacherQuery, setTeacherQuery] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [viewingRowId, setViewingRowId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] =
    useState<FeedingStatusFilter>("completed");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredRows = useMemo(() => {
    const teacher = teacherQuery.trim().toLowerCase();
    const food = foodQuery.trim().toLowerCase();
    if (!teacher && !food) return rows;
    return rows.filter((row) => {
      if (teacher && !String(row.teacherName).toLowerCase().includes(teacher)) {
        return false;
      }
      if (food && !String(row.foodServed).toLowerCase().includes(food)) {
        return false;
      }
      return true;
    });
  }, [foodQuery, rows, teacherQuery]);

  const analytics = useMemo(() => {
    const total = filteredRows.length;
    const completed = filteredRows.reduce(
      (acc, row) => acc + (row.status === "completed" ? 1 : 0),
      0,
    );
    const missed = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, missed, rate };
  }, [filteredRows]);

  const viewingRow = useMemo(
    () => filteredRows.find((row) => row.id === viewingRowId) ?? null,
    [filteredRows, viewingRowId],
  );

  const beginView = (id: string) => {
    setActionError(null);
    setViewingRowId(id);
  };

  const closeView = () => {
    setViewingRowId(null);
    setActionError(null);
  };

  const beginEdit = (id: string, status: FeedingStatusFilter) => {
    setActionError(null);
    setEditingId(id);
    setEditingStatus(status);
  };

  const confirmDelete = (id: string) => {
    setActionError(null);
    setDeletingId(id);
  };

  const closeDelete = () => {
    setDeletingId(null);
    setActionError(null);
    setIsSaving(false);
  };

  const closeEdit = () => {
    setEditingId(null);
    setActionError(null);
    setIsSaving(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await updateFeedingStatus(
        editingId,
        editingStatus as "completed" | "missed",
      );
      closeEdit();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Update failed");
      setIsSaving(false);
    }
  };

  const runDelete = async () => {
    if (!deletingId) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await deleteFeeding(deletingId);
      closeDelete();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
      setIsSaving(false);
    }
  };

  return (
    <Layout
      activeItem="feeding"
      breadcrumbs={["Admin", "Feeding Program"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-50">
            Feeding Program
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Review daily feeding submissions and meal details from teachers.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Records on page"
            value={String(analytics.total)}
            subtitle="Current filtered results"
            icon={Utensils}
            color="blue"
          />
          <StatCard
            title="Completed"
            value={String(analytics.completed)}
            subtitle="Meals recorded as completed"
            icon={CheckCircle2}
            color="teal"
          />
          <StatCard
            title="Missed"
            value={String(analytics.missed)}
            subtitle="Meals recorded as missed"
            icon={CircleX}
            color="rose"
          />
          <StatCard
            title="Completion rate"
            value={`${analytics.rate}%`}
            subtitle="Across filtered records on this page"
            icon={Gauge}
            color="purple"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-slate-700 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Daily Feeding Logs
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Search by student, meal, or filter by date range to find
                specific records.
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm lg:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search feeding records..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/60 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/40 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
              <button
                type="button"
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                className="whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                {isAdvancedOpen ? "Hide filters" : "Advanced filters"}
              </button>
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                className="whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          {isAdvancedOpen && (
            <div className="grid gap-3 border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => updateDateRange(e.target.value, endDate)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => updateDateRange(startDate, e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Teacher contains
                </label>
                <input
                  type="text"
                  value={teacherQuery}
                  onChange={(e) => setTeacherQuery(e.target.value)}
                  placeholder="e.g. Arenas"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Food contains
                </label>
                <input
                  type="text"
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder="e.g. Tinola"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                />
              </div>
              <div className="md:col-span-4">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Date range is server-filtered. Teacher/Food filters are applied
                  to the current page.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse lg:min-w-0">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/50">
                <tr>
                  <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
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
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
                    >
                      No feeding records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
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
                      <td className="px-6 py-4">
                        <div className="flex flex-nowrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => beginView(row.id)}
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
                            onClick={() => beginEdit(row.id, row.status)}
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
                            onClick={() => confirmDelete(row.id)}
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

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                Edit feeding record
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Only feeding status is editable in the current API.
              </p>
            </div>
            <div className="space-y-4 px-6 py-4">
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
                  {actionError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Feeding status
                </label>
                <select
                  value={editingStatus}
                  onChange={(e) =>
                    setEditingStatus(e.target.value as FeedingStatusFilter)
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                >
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
              <button
                type="button"
                onClick={closeEdit}
                disabled={isSaving}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={isSaving}
                className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                Feeding record details
              </h3>
            </div>
            <div className="grid gap-3 px-6 py-4 md:grid-cols-2">
              <Detail label="Student ID" value={viewingRow.studentId || "—"} />
              <Detail label="Child" value={viewingRow.childName} />
              <Detail label="Date" value={formatDate(viewingRow.date)} />
              <Detail label="Food served" value={viewingRow.foodServed || "—"} />
              <Detail
                label="Status"
                value={viewingRow.status === "completed" ? "Completed" : "Missed"}
              />
              <Detail label="Recorded by" value={viewingRow.teacherName || "—"} />
              <Detail
                label="Submitted at"
                value={formatDateTime(viewingRow.submittedAt)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
              <button
                type="button"
                onClick={closeView}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                Delete feeding record
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                This removes the child record from the selected feeding entry.
              </p>
            </div>
            <div className="space-y-4 px-6 py-4">
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
                  {actionError}
                </div>
              )}
              <p className="text-sm text-gray-700 dark:text-slate-200">
                Are you sure you want to delete this record?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
              <button
                type="button"
                onClick={closeDelete}
                disabled={isSaving}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runDelete()}
                disabled={isSaving}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">
        {label}
      </div>
      <div className="text-sm text-gray-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: "blue" | "teal" | "purple" | "rose";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-slate-100">
              {value}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
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

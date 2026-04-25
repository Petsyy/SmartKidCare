import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Search,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { getUsers, type User } from "@/api/authentication.api";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import {
  useAttendanceTracking,
  type DatePreset,
  type AttendanceStatusFilter,
} from "@/hooks/useAttendanceTracking";

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

export default function AttendanceTracking() {
  const navigate = useNavigate();
  const {
    rows,
    search,
    datePreset,
    startDate,
    endDate,
    statusFilter,
    teacherId,
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
    updateTeacherFilter,
    clearFilters,
    updateAttendanceStatus,
    deleteAttendance,
  } = useAttendanceTracking();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [centerId, setCenterId] = useState("");
  const [viewingRowId, setViewingRowId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] =
    useState<AttendanceStatusFilter>("present");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pickDefaultTeacher = (items: User[]) => {
    const sorted = [...items].sort((left, right) =>
      `${left.lastName}, ${left.firstName}`.localeCompare(
        `${right.lastName}, ${right.firstName}`,
      ),
    );

    const bonuanGueset = sorted.find((teacher) =>
      `${teacher.daycareCenter?.name || ""} ${teacher.daycareCenter?.barangay || ""}`
        .toLowerCase()
        .includes("bonuan gueset"),
    );

    return bonuanGueset ?? sorted[0] ?? null;
  };

  useEffect(() => {
    let isMounted = true;
    const loadTeachers = async () => {
      setTeachersLoading(true);
      setTeachersError(null);
      try {
        const users = await getUsers({ role: "teacher" });
        if (!isMounted) return;
        setTeachers(users);

        const activeTeachers = users.filter((teacher) => teacher.isActive !== false);
        const defaultTeacher =
          pickDefaultTeacher(activeTeachers) ?? pickDefaultTeacher(users);

        if (defaultTeacher) {
          setCenterId(defaultTeacher.daycareCenter?._id ?? "");
          updateTeacherFilter(defaultTeacher._id);
        } else {
          setCenterId("");
          updateTeacherFilter("");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setTeachersError(
          err instanceof Error ? err.message : "Failed to load teachers",
        );
      } finally {
        if (isMounted) setTeachersLoading(false);
      }
    };

    void loadTeachers();

    return () => {
      isMounted = false;
    };
  }, [updateTeacherFilter]);

  const centerOptions = useMemo(
    () =>
      Array.from(
        new Map(
          teachers
            .filter((teacher) => Boolean(teacher.daycareCenter?._id))
            .map((teacher) => [
              teacher.daycareCenter!._id,
              teacher.daycareCenter as NonNullable<User["daycareCenter"]>,
            ]),
        ).values(),
      ).sort((left, right) =>
        `${left.code} ${left.barangay} ${left.name}`.localeCompare(
          `${right.code} ${right.barangay} ${right.name}`,
        ),
      ),
    [teachers],
  );

  const teacherOptions = useMemo(() => {
    const sortedTeachers = [...teachers].sort((left, right) =>
      `${left.lastName}, ${left.firstName}`.localeCompare(
        `${right.lastName}, ${right.firstName}`,
      ),
    );

    if (!centerId) return sortedTeachers;
    return sortedTeachers.filter((teacher) => teacher.daycareCenter?._id === centerId);
  }, [centerId, teachers]);

  useEffect(() => {
    if (!teacherId) {
      if (teacherOptions.length > 0) {
        updateTeacherFilter(teacherOptions[0]._id);
      }
      return;
    }

    const isTeacherVisible = teacherOptions.some(
      (teacher) => teacher._id === teacherId,
    );
    if (!isTeacherVisible) {
      updateTeacherFilter(teacherOptions[0]?._id ?? "");
    }
  }, [teacherId, teacherOptions, updateTeacherFilter]);

  const filteredRows = rows;

  const analytics = useMemo(() => {
    const total = filteredRows.length;
    const present = filteredRows.reduce(
      (acc, row) => acc + (row.status === "present" ? 1 : 0),
      0,
    );
    const absent = total - present;
    const rate = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, absent, rate };
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

  const beginEdit = (id: string, status: AttendanceStatusFilter) => {
    setActionError(null);
    setEditingId(id);
    setEditingStatus(status);
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
      await updateAttendanceStatus(
        editingId,
        editingStatus as "present" | "absent",
      );
      closeEdit();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Update failed");
      setIsSaving(false);
    }
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

  const runDelete = async () => {
    if (!deletingId) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await deleteAttendance(deletingId);
      closeDelete();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
      setIsSaving(false);
    }
  };

  return (
    <Layout
      activeItem="attendance"
      breadcrumbs={["Admin", "Attendance Tracking"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-50">
            Attendance Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Monitor daily submissions from teachers and keep parents informed.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Records on page"
            value={String(analytics.total)}
            subtitle="Current filtered results"
            icon={Users}
            color="blue"
          />
          <AdminStatCard
            title="Present"
            value={String(analytics.present)}
            subtitle="Marked present on this page"
            icon={UserCheck}
            color="teal"
          />
          <AdminStatCard
            title="Absent"
            value={String(analytics.absent)}
            subtitle="Marked absent on this page"
            icon={UserX}
            color="rose"
          />
          <AdminStatCard
            title="Present rate"
            value={`${analytics.rate}%`}
            subtitle="Across filtered records on this page"
            icon={Calendar}
            color="purple"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-gray-200 p-4 dark:border-slate-700 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  Daily Attendance Logs
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Search by child ID or filter by date range to find specific
                  records.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
                <div className="relative w-full sm:w-72 lg:w-80">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => updateSearch(event.target.value)}
                    placeholder="Search attendance records..."
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <select
                    value={datePreset}
                    onChange={(event) =>
                      updateDatePreset(event.target.value as DatePreset)
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      updateStatusFilter(
                        event.target.value as AttendanceStatusFilter,
                      )
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
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
                  Center
                </label>
                <select
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  disabled={teachersLoading}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                >
                  {centerOptions.length === 0 && (
                    <option value="" disabled>
                      No centers available
                    </option>
                  )}
                  {centerOptions.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.code} - {center.barangay}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Teacher
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => updateTeacherFilter(e.target.value)}
                  disabled={teachersLoading}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                >
                  {teacherOptions.length === 0 && (
                    <option value="" disabled>
                      No teachers available
                    </option>
                  )}
                  {teacherOptions.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.lastName}, {teacher.firstName} (
                      {teacher.daycareCenter?.code || "NO CENTER"})
                      {teacher.isActive === false ? " (Inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Date range and teacher filters are server-filtered. Pick a
                  center first to narrow the teacher list.
                </p>
                {teachersError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                    {teachersError}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <AttendanceTable
            isLoading={isLoading}
            rows={filteredRows}
            onViewRecord={beginView}
            onEditRecord={beginEdit}
            onDeleteRecord={confirmDelete}
          />
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
                Edit attendance record
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Only attendance status is editable in the current API.
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
                  Attendance status
                </label>
                <select
                  value={editingStatus}
                  onChange={(e) =>
                    setEditingStatus(e.target.value as AttendanceStatusFilter)
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
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

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                Delete attendance record
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                This removes the child record from the selected attendance entry.
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

      {viewingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                Attendance record details
              </h3>
            </div>
            <div className="grid gap-3 px-6 py-4 md:grid-cols-2">
              <Detail label="Child ID" value={viewingRow.studentId || "-"} />
              <Detail label="Child Name" value={viewingRow.childName || "-"} />
              <Detail label="Date" value={formatDate(viewingRow.date)} />
              <Detail
                label="Status"
                value={viewingRow.status === "present" ? "Present" : "Absent"}
              />
              <Detail label="Recorded by" value={viewingRow.teacherName || "-"} />
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



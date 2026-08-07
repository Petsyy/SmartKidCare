import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, UserCheck, UserX, Users } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useTeacherCenterFilter } from "@/shared/hooks/useTeacherCenterFilter";
import { AttendanceFilters } from "@/features/attendance/components/AttendanceFilters";
import { AttendanceTable } from "@/features/attendance/components/AttendanceTable";
import { EditAttendanceModal } from "@/features/attendance/components/EditAttendanceModal";
import { DeleteAttendanceModal } from "@/features/attendance/components/DeleteAttendanceModal";
import { ViewAttendanceModal } from "@/features/attendance/components/ViewAttendanceModal";
import {
  useAttendanceTracking,
  type AttendanceStatusFilter,
} from "@/features/attendance/hooks/useAttendanceTracking";

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

  const {
    teachers,
    teachersLoading,
    teachersError,
    centerId,
    setCenterId,
    centerOptions,
    teacherOptions,
  } = useTeacherCenterFilter({ teacherId, updateTeacherFilter });

  // Modal state
  const [viewingRowId, setViewingRowId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] =
    useState<AttendanceStatusFilter>("present");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Analytics ---
  const analytics = useMemo(() => {
    const total = rows.length;
    const present = rows.reduce(
      (acc, row) => acc + (row.status === "present" ? 1 : 0),
      0,
    );
    const absent = total - present;
    const rate = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, absent, rate };
  }, [rows]);

  // --- Modal handlers ---
  const viewingRow = useMemo(
    () => rows.find((row) => row.id === viewingRowId) ?? null,
    [rows, viewingRowId],
  );

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
        <PageHeader
          title="Attendance Tracking"
          subtitle="Monitor daily submissions from teachers and keep parents informed."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Records on page"
            value={String(analytics.total)}
            subtitle="Current filtered results"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Present"
            value={String(analytics.present)}
            subtitle="Marked present on this page"
            icon={UserCheck}
            color="teal"
          />
          <StatCard
            title="Absent"
            value={String(analytics.absent)}
            subtitle="Marked absent on this page"
            icon={UserX}
            color="rose"
          />
          <StatCard
            title="Present rate"
            value={`${analytics.rate}%`}
            subtitle="Across filtered records on this page"
            icon={Calendar}
            color="purple"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <AttendanceFilters
            search={search}
            datePreset={datePreset}
            startDate={startDate}
            endDate={endDate}
            statusFilter={statusFilter}
            teacherId={teacherId}
            hasActiveFilters={hasActiveFilters}
            teachers={teachers}
            teachersLoading={teachersLoading}
            teachersError={teachersError}
            centerId={centerId}
            onCenterChange={setCenterId}
            centerOptions={centerOptions}
            teacherOptions={teacherOptions}
            onSearchChange={updateSearch}
            onDatePresetChange={updateDatePreset}
            onDateRangeChange={updateDateRange}
            onStatusFilterChange={updateStatusFilter}
            onTeacherFilterChange={updateTeacherFilter}
            onClearFilters={clearFilters}
          />

          <ErrorAlert message={error} />

          <AttendanceTable
            isLoading={isLoading}
            rows={rows}
            onViewRecord={(id) => {
              setActionError(null);
              setViewingRowId(id);
            }}
            onEditRecord={beginEdit}
            onDeleteRecord={confirmDelete}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            rangeLabel={rangeLabel}
            onPageChange={setPage}
            disabled={isLoading}
            pageSizeOptions={[10, 25, 50]}
            pageSize={limit}
            onPageSizeChange={setLimit}
          />
        </div>
      </div>

      <EditAttendanceModal
        open={editingId !== null}
        onClose={closeEdit}
        status={editingStatus}
        onStatusChange={setEditingStatus}
        onSave={() => void saveEdit()}
        isSaving={isSaving}
        error={actionError}
      />

      <DeleteAttendanceModal
        open={deletingId !== null}
        onClose={closeDelete}
        onConfirm={() => void runDelete()}
        isSaving={isSaving}
        error={actionError}
      />

      <ViewAttendanceModal
        row={viewingRow}
        onClose={() => {
          setViewingRowId(null);
          setActionError(null);
        }}
      />
    </Layout>
  );
}

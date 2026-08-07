import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Gauge, Utensils } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useTeacherCenterFilter } from "@/shared/hooks/useTeacherCenterFilter";
import { StatCard } from "@/components/ui/StatCard";
import { FeedingTable } from "@/features/feeding/components/FeedingTable";
import { FeedingFilters } from "@/features/feeding/components/FeedingFilters";
import { FeedingEditModal } from "@/features/feeding/components/FeedingEditModal";
import { FeedingViewModal } from "@/features/feeding/components/FeedingViewModal";
import { FeedingDeleteModal } from "@/features/feeding/components/FeedingDeleteModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import {
  useFeedingProgram,
  type FeedingStatusFilter,
} from "@/features/feeding/hooks/useFeedingProgram";

export default function FeedingProgram() {
  const navigate = useNavigate();
  const {
    rows,
    search,
    datePreset,
    startDate,
    endDate,
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
    updateTeacherFilter,
    clearFilters,
    updateFeedingStatus,
    deleteFeeding,
  } = useFeedingProgram();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const {
    teachersLoading,
    teachersError,
    centerId,
    setCenterId,
    centerOptions,
    teacherOptions,
  } = useTeacherCenterFilter({ teacherId, updateTeacherFilter });

  const [viewingRowId, setViewingRowId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] =
    useState<FeedingStatusFilter>("completed");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const analytics = useMemo(() => {
    const total = rows.length;
    const completed = rows.reduce(
      (acc, row) => acc + (row.status === "completed" ? 1 : 0),
      0,
    );
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, rate };
  }, [rows]);

  const viewingRow = useMemo(
    () => rows.find((row) => row.id === viewingRowId) ?? null,
    [rows, viewingRowId],
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
        <PageHeader
          title="Feeding Program"
          subtitle="Track daily supplementary feeding for students"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            title="Completion rate"
            value={`${analytics.rate}%`}
            subtitle="Across filtered records on this page"
            icon={Gauge}
            color="purple"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <FeedingFilters
            search={search}
            updateSearch={updateSearch}
            datePreset={datePreset}
            updateDatePreset={updateDatePreset}
            isAdvancedOpen={isAdvancedOpen}
            setIsAdvancedOpen={setIsAdvancedOpen}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            startDate={startDate}
            endDate={endDate}
            updateDateRange={updateDateRange}
            centerId={centerId}
            setCenterId={setCenterId}
            teachersLoading={teachersLoading}
            centerOptions={centerOptions}
            teacherId={teacherId}
            updateTeacherFilter={updateTeacherFilter}
            teacherOptions={teacherOptions}
            teachersError={teachersError}
          />

          <ErrorAlert message={error} />

          <FeedingTable
            isLoading={isLoading}
            rows={rows}
            onViewRecord={beginView}
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
            onPageSizeChange={(newSize) => {
              setPage(1);
              setLimit(newSize);
            }}
          />
        </div>
      </div>

      <FeedingEditModal
        editingId={editingId || ""}
        editingStatus={editingStatus}
        setEditingStatus={setEditingStatus}
        actionError={actionError}
        isSaving={isSaving}
        onClose={closeEdit}
        onSave={() => void saveEdit()}
      />

      <FeedingViewModal viewingRow={viewingRow} onClose={closeView} />

      <FeedingDeleteModal
        deletingId={deletingId}
        actionError={actionError}
        isSaving={isSaving}
        onClose={closeDelete}
        onDelete={() => void runDelete()}
      />
    </Layout>
  );
}

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Gauge, Utensils } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { FeedingTable } from "@/features/feeding/components/FeedingTable";
import { FeedingFilters } from "@/features/feeding/components/FeedingFilters";
import { FeedingViewModal } from "@/features/feeding/components/FeedingViewModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useFeedingProgram } from "@/features/feeding/hooks/useFeedingProgram";
import type {
  DatePreset,
  FeedingStatusFilter,
} from "@/features/feeding/hooks/useFeedingProgram";

const parseDatePreset = (value: string | null): DatePreset =>
  value === "today" || value === "thisWeek" || value === "thisMonth"
    ? value
    : "all";

const parseStatusFilter = (value: string | null): FeedingStatusFilter =>
  value === "completed" || value === "missed" ? value : "all";

export default function FeedingProgram() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    rows,
    search,
    datePreset,
    statusFilter,
    startDate,
    endDate,
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
    updateDateRange,
    clearFilters,
  } = useFeedingProgram({
    initialDatePreset: parseDatePreset(searchParams.get("datePreset")),
    initialStatusFilter: parseStatusFilter(searchParams.get("status")),
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [viewingRowId, setViewingRowId] = useState<string | null>(null);

  const analytics = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((row) => row.status === "completed").length;
    return {
      total,
      completed,
      rate: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }, [rows]);

  const viewingRow = useMemo(
    () => rows.find((row) => row.id === viewingRowId) ?? null,
    [rows, viewingRowId],
  );

  return (
    <Layout
      activeItem="monitoring/feeding"
      breadcrumbs={["Barangay Captain", "Feeding Monitoring"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Feeding Monitoring"
          subtitle="Read-only review of feeding records submitted by Child Development Workers"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <StatCardSkeleton color="blue" />
              <StatCardSkeleton color="teal" />
              <StatCardSkeleton color="purple" />
            </>
          ) : (
            <>
              <StatCard title="Records on page" value={String(analytics.total)} subtitle="Current filtered results" icon={Utensils} color="blue" />
              <StatCard title="Completed" value={String(analytics.completed)} subtitle="Meals recorded as completed" icon={CheckCircle2} color="teal" />
              <StatCard title="Completion rate" value={`${analytics.rate}%`} subtitle="Across filtered records on this page" icon={Gauge} color="purple" />
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <FeedingFilters
            search={search}
            updateSearch={updateSearch}
            datePreset={datePreset}
            updateDatePreset={updateDatePreset}
            statusFilter={statusFilter}
            updateStatusFilter={updateStatusFilter}
            isAdvancedOpen={isAdvancedOpen}
            setIsAdvancedOpen={setIsAdvancedOpen}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            startDate={startDate}
            endDate={endDate}
            updateDateRange={updateDateRange}
            teachersLoading={false}
            teacherId=""
            updateTeacherFilter={() => undefined}
            teacherOptions={[]}
            teachersError={null}
            showTeacherFilter={false}
          />

          <ErrorAlert message={error} />
          <FeedingTable
            isLoading={isLoading}
            rows={rows}
            onViewRecord={setViewingRowId}
            onEditRecord={() => undefined}
            onDeleteRecord={() => undefined}
            readOnly
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

      <FeedingViewModal
        viewingRow={viewingRow}
        onClose={() => setViewingRowId(null)}
      />
    </Layout>
  );
}

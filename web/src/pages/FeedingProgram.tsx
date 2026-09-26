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
import type { DatePreset } from "@/features/feeding/hooks/useFeedingProgram";

const parseDatePreset = (value: string | null): DatePreset =>
  value === "today" || value === "thisWeek" || value === "thisMonth"
    ? value
    : "all";

export default function FeedingProgram() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    rows,
    search,
    datePreset,
    foodServedFilter,
    foodOptions,
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
    updateFoodServedFilter,
    clearFilters,
  } = useFeedingProgram({
    initialDatePreset: parseDatePreset(searchParams.get("datePreset")),
  });

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
          subtitle="Read-only review of feeding records submitted by Child Development Worker"
        />

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <FeedingFilters
            search={search}
            updateSearch={updateSearch}
            datePreset={datePreset}
            updateDatePreset={updateDatePreset}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            foodServedFilter={foodServedFilter}
            foodOptions={foodOptions}
            updateFoodServedFilter={updateFoodServedFilter}
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

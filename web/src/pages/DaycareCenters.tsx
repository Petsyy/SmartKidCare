import { useState } from "react";
import { Search, Plus, Building2, CheckCircle, XCircle } from "lucide-react";
import { CentersTable } from "@/features/centers/components/CentersTable";
import { AddCenterModal } from "@/features/centers/components/AddCenterModal";
import { EditCenterModal } from "@/features/centers/components/EditCenterModal";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { StatCard } from "@/components/ui/StatCard";
import { type DaycareCenter } from "@/api/daycare-center.api";
import { useDaycareCenters } from "@/features/centers/hooks/useDaycareCenters";

export default function DaycareCenters() {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<DaycareCenter | null>(null);

  const {
    centers,
    isLoading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    filteredCenters,
    paginatedCenters,
    activeCount,
    inactiveCount,
    handleAddCenter,
    handleUpdateCenter
  } = useDaycareCenters();

  return (
    <Layout
      activeItem="centers"
      breadcrumbs={["Admin", "Child Development Centers"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <PageHeader
          title="Child Development Centers"
          subtitle="Manage the Dagupan City barangay center list used for teacher assignments."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Centers"
            value={String(centers.length)}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Active Centers"
            value={String(activeCount)}
            icon={CheckCircle}
            color="teal"
          />
          <StatCard
            title="Inactive Centers"
            value={String(inactiveCount)}
            icon={XCircle}
            color="rose"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Dagupan Centers
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative group w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-teal-600 dark:text-slate-500 dark:group-focus-within:text-teal-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by center or barangay..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition-all hover:bg-gray-50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="ml-2 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  <Plus size={16} />
                  <span>New Center</span>
                </button>
              </div>
            </div>
          </div>

          <ErrorAlert message={error} />

          <CentersTable
            centers={paginatedCenters}
            isLoading={isLoading}
            onEdit={setEditingCenter}
          />

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            rangeLabel={`${filteredCenters.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredCenters.length)} of ${filteredCenters.length}`}
            onPageChange={setCurrentPage}
            disabled={isLoading}
            pageSizeOptions={[10, 25, 50]}
            pageSize={itemsPerPage}
            onPageSizeChange={(newSize) => {
              setCurrentPage(1);
              setItemsPerPage(newSize);
            }}
          />
        </div>
      </div>
      <AddCenterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCenter}
      />
      <EditCenterModal
        center={editingCenter}
        onClose={() => setEditingCenter(null)}
        onUpdate={handleUpdateCenter}
      />
    </Layout>
  );
}


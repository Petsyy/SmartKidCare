import { useNavigate } from "react-router-dom";
import { Filter, Search, ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import type { EnrollmentRequestStatus } from "@/api/admin.api";
import { useEnrollmentRequests } from "@/features/enrollment/hooks/useEnrollmentRequests";
import { EnrollmentTable } from "@/features/enrollment/components/EnrollmentTable";
import { ViewRequestModal } from "@/features/enrollment/components/ViewRequestModal";
import { DeleteEnrollmentRequestModal } from "@/features/enrollment/components/DeleteEnrollmentRequestModal";
import { EnrollmentActionMenu } from "@/features/enrollment/components/EnrollmentActionMenu";
import { useState, useMemo } from "react";

export default function EnrollmentRequests() {
  const navigate = useNavigate();
  const {
    requests,
    loading,
    stats,
    processingId,
    selectedRequest,
    openMenuId,
    menuAnchorRect,
    menuRequest,
    statusFilter,
    deletingRequest,
    setSelectedRequest,
    setStatusFilter,
    setDeletingRequest,
    openMenu,
    closeMenu,
    handleApprove,
    handleReject,
    handleDelete,
    confirmDeleteRequest
  } = useEnrollmentRequests();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;
    const lowerSearch = searchTerm.toLowerCase();
    return requests.filter((req) => {
      const childName = `${req.child.firstName} ${req.child.lastName}`.toLowerCase();
      const parentName = `${req.parent.firstName} ${req.parent.lastName}`.toLowerCase();
      return childName.includes(lowerSearch) || parentName.includes(lowerSearch);
    });
  }, [requests, searchTerm]);

  return (
    <Layout
      activeItem="enrollment-requests"
      breadcrumbs={["Admin", "Enrollment Requests"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <PageHeader
          title="Enrollment Requests"
          subtitle="Manage parent requests to link their accounts with student profiles"
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton color="blue" />
              <StatCardSkeleton color="teal" />
              <StatCardSkeleton color="purple" />
              <StatCardSkeleton color="rose" />
            </>
          ) : (
            <>
              <StatCard
                title="Total"
                value={String(stats.total)}
                subtitle="Total submissions"
                icon={ClipboardList}
                color="blue"
              />
              <StatCard
                title="Pending"
                value={String(stats.pending)}
                subtitle="Awaiting review"
                icon={Clock}
                color="teal"
              />
              <StatCard
                title="Approved"
                value={String(stats.approved)}
                subtitle="Official records"
                icon={CheckCircle}
                color="purple"
              />
              <StatCard
                title="Rejected"
                value={String(stats.rejected)}
                subtitle="Denied submissions"
                icon={XCircle}
                color="rose"
              />
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Review Queue
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as EnrollmentRequestStatus,
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <EnrollmentTable
            requests={filteredRequests}
            loading={loading}
            statusFilter={statusFilter}
            processingId={processingId}
            openMenuId={openMenuId}
            onOpenMenu={openMenu}
            onSetSelectedRequest={setSelectedRequest}
            onApprove={(req) => void handleApprove(req)}
            onReject={(req) => void handleReject(req)}
            onDelete={(req) => void handleDelete(req)}
          />
        </div>
      </div>

      {selectedRequest && (
        <ViewRequestModal
          selectedRequest={selectedRequest}
          processingId={processingId}
          onClose={() => setSelectedRequest(null)}
          onReject={(req) => void handleReject(req)}
          onApprove={(req) => void handleApprove(req)}
        />
      )}

      {deletingRequest && (
        <DeleteEnrollmentRequestModal
          request={deletingRequest}
          onClose={() => setDeletingRequest(null)}
          onDelete={confirmDeleteRequest}
        />
      )}

      {openMenuId && menuRequest && menuAnchorRect && (
        <EnrollmentActionMenu
          request={menuRequest}
          anchorRect={menuAnchorRect}
          onClose={closeMenu}
          onDelete={(req) => void handleDelete(req)}
          isProcessing={processingId === menuRequest._id}
        />
      )}
    </Layout>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {School,Search,UserCheck,UserX,Users,ClipboardList} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import EditChildModal, {type ChildForEdit} from "@/features/children/components/EditChildModal";
import ChildDetailsModal from "@/features/children/components/ChildDetailsModal";
import { useChildrenManagement } from "@/features/children/hooks/useChildrenManagement";
import { useContextMenu } from "@/features/children/hooks/useContextMenu";
import { useChildrenFilters } from "@/features/children/hooks/useChildrenFilters";
import { ChildrenTable } from "@/features/children/components/ChildrenTable";
import { ChildContextMenu } from "@/features/children/components/ChildContextMenu";
import { ChangeStatusModal } from "@/features/children/components/ChangeStatusModal";
import { DeleteChildModal } from "@/features/children/components/DeleteChildModal";
import { getChildBlockchainProof, getChildDocumentUrl } from "@/api/child.api";
import type {Child,ChildBlockchainProof,ChildDocumentType} from "@/types/child";

export default function ChildrenManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [viewingChild, setViewingChild] = useState<Child | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [blockchainProof, setBlockchainProof] =
    useState<ChildBlockchainProof | null>(null);
  const [blockchainProofLoading, setBlockchainProofLoading] = useState(false);
  const [blockchainProofError, setBlockchainProofError] = useState<
    string | null
  >(null);
  const [documentLoading, setDocumentLoading] =
    useState<ChildDocumentType | null>(null);
  const [statusModalChild, setStatusModalChild] = useState<Child | null>(null);
  const [statusModalValue, setStatusModalValue] = useState<string>("Active");
  const [deleteModalChild, setDeleteModalChild] = useState<Child | null>(null);

  const {
    children,
    isLoading,
    handleChangeStatus,
    handleUnlinkParent,
    handleDeleteChild,
  } = useChildrenManagement();

  const prefillSearch = searchParams.get("prefillSearch");

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    assignmentFilter,
    setAssignmentFilter,
    centerFilter,
    setCenterFilter,
    schoolYearFilter,
    setSchoolYearFilter,
    page: safePage,
    setPage,
    limit,
    setLimit,
    centerOptions,
    schoolYearOptions,
    totalPages,
    rangeLabel,
    pagedChildren,
    hasActiveFilters,
    clearFilters,
    stats,
  } = useChildrenFilters({ childrenList: children });

  useEffect(() => {
    if (!prefillSearch) return;

    setSearchTerm(prefillSearch);
    setPage(1);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("prefillSearch");
        return next;
      },
      { replace: true },
    );
  }, [prefillSearch, setPage, setSearchTerm, setSearchParams]);

  const {
    openMenuUserId,
    menuAnchorRect,
    menuUser: menuChild,
    openMenu,
    closeMenu,
  } = useContextMenu();

  const closeViewModal = () => {
    setViewingChild(null);
    setViewError(null);
    setBlockchainProof(null);
    setBlockchainProofError(null);
    setBlockchainProofLoading(false);
    setDocumentLoading(null);
  };

  const openViewModal = (child: Child) => {
    setViewingChild(child);
    setViewError(null);
    setBlockchainProof(null);
    setBlockchainProofError(null);
    setBlockchainProofLoading(true);

    getChildBlockchainProof(child._id)
      .then((proof) => {
        setBlockchainProof(proof);
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load blockchain proof";
        setBlockchainProofError(message);
      })
      .finally(() => {
        setBlockchainProofLoading(false);
      });
  };

  const handleOpenDocument = async (documentType: ChildDocumentType) => {
    if (!viewingChild) {
      return;
    }

    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setViewError(
        "Unable to open document. Please allow pop-ups and try again.",
      );
      return;
    }

    popup.document.title = "Opening document...";
    popup.document.body.innerHTML =
      "<p style='font-family: sans-serif; padding: 16px;'>Loading document...</p>";

    setViewError(null);
    setDocumentLoading(documentType);

    try {
      const { url } = await getChildDocumentUrl(viewingChild._id, documentType);
      if (!url) {
        throw new Error("Signed URL was not returned by the server.");
      }
      popup.location.href = url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to open document";
      popup.document.title = "Unable to open document";
      popup.document.body.innerHTML = `<div style="font-family: sans-serif; padding: 16px;">
        <h3 style="margin: 0 0 8px;">Unable to open document</h3>
        <p style="margin: 0;">${message}</p>
      </div>`;
      setViewError(message);
    } finally {
      setDocumentLoading(null);
    }
  };

  return (
    <Layout
      activeItem="children"
      breadcrumbs={["Admin", "Children Records"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <PageHeader
          title="Children Records"
          subtitle="View and manage student information"
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <>
              <StatCardSkeleton color="blue" />
              <StatCardSkeleton color="teal" />
              <StatCardSkeleton color="rose" />
              <StatCardSkeleton color="purple" />
            </>
          ) : (
            <>
              <StatCard
                title="Total enrollment"
                value={String(stats.totalChildren)}
                subtitle={`${stats.active} active students`}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Active"
                value={String(stats.active)}
                subtitle="Currently marked as Active"
                icon={UserCheck}
                color="teal"
              />
              <StatCard
                title="Inactive"
                value={String(stats.inactive)}
                subtitle="Currently marked as Inactive"
                icon={UserX}
                color="rose"
              />
              <StatCard
                title="Unassigned"
                value={String(stats.unassigned)}
                subtitle="Without an assigned teacher"
                icon={School}
                color="purple"
              />
            </>
          )}
        </div>

        {/* Student Directory Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Card Header */}
          <div className="flex flex-col gap-4 border-b p-6 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Student Directory
              </h2>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* Search */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search children..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value as typeof statusFilter);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  value={assignmentFilter}
                  onChange={(e) => {
                    setPage(1);
                    setAssignmentFilter(
                      e.target.value as typeof assignmentFilter,
                    );
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Assignment</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>

                <select
                  value={schoolYearFilter}
                  onChange={(e) => {
                    setPage(1);
                    setSchoolYearFilter(e.target.value);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Years</option>
                  {schoolYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  value={centerFilter}
                  onChange={(e) => {
                    setPage(1);
                    setCenterFilter(e.target.value);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Centers</option>
                  {centerOptions.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!hasActiveFilters}
                  onClick={clearFilters}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={() => navigate("/enrollment-requests")}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-teal-500/20 bg-linear-to-r from-teal-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-600 dark:border-cyan-400/20 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-500 dark:hover:to-cyan-500"
              >
                <ClipboardList size={16} />
                Review Requests
              </button>
            </div>
          </div>

          <ChildrenTable
            isLoading={isLoading}
            children={children}
            filteredChildren={pagedChildren}
            onViewChild={openViewModal}
            onEditChild={setEditingChild}
            onMenuClick={openMenu}
          />

          <Pagination
            page={safePage}
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

      {editingChild && (
        <EditChildModal
          child={editingChild as ChildForEdit}
          onClose={() => setEditingChild(null)}
          onUpdated={() => {
            setEditingChild(null);
          }}
        />
      )}

      {openMenuUserId && menuChild && menuAnchorRect && (
        <ChildContextMenu
          child={menuChild as Child}
          anchorRect={menuAnchorRect}
          onClose={closeMenu}
          onChangeStatus={(child) => {
            setStatusModalChild(child);
            setStatusModalValue(child.status || "Active");
          }}
          onUnlinkParent={handleUnlinkParent}
          onDelete={(child) => setDeleteModalChild(child)}
        />
      )}

      <ChildDetailsModal
        child={viewingChild}
        viewError={viewError}
        documentLoading={documentLoading}
        blockchainProof={blockchainProof}
        blockchainProofLoading={blockchainProofLoading}
        blockchainProofError={blockchainProofError}
        onClose={closeViewModal}
        onOpenDocument={handleOpenDocument}
      />

      {statusModalChild && (
        <ChangeStatusModal
          child={statusModalChild}
          value={statusModalValue}
          onChangeValue={setStatusModalValue}
          onClose={() => setStatusModalChild(null)}
          onSubmit={async (child, newStatus) => {
            await handleChangeStatus(child, newStatus);
          }}
        />
      )}

      {deleteModalChild && (
        <DeleteChildModal
          child={deleteModalChild}
          onClose={() => setDeleteModalChild(null)}
          onDelete={async (child) => {
            await handleDeleteChild(child);
          }}
        />
      )}
    </Layout>
  );
}

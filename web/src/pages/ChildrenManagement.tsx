import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  School,
  Search,
  Trash2,
  Unlink,
  ToggleLeft,
  UserCheck,
  UserX,
  Users,
  ClipboardList,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import EditChildModal, {
  type ChildForEdit,
} from "@/components/modals/child/EditChildModal";
import ChildDetailsModal from "../components/child/ChildDetailsModal";
import { useChildrenManagement } from "@/hooks/useChildrenManagement";
import { useContextMenu } from "@/hooks/useContextMenu";
import { ChildrenTable } from "@/components/ChildrenTable";
import { getChildBlockchainProof, getChildDocumentUrl } from "@/api/child.api";
import type {
  Child,
  ChildBlockchainProof,
  ChildDocumentType,
} from "@/types/child";

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
    search,
    setSearch,
    isLoading,
    filteredChildren,
    handleChangeStatus,
    handleUnlinkParent,
    handleDeleteChild,
  } = useChildrenManagement();

  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Inactive"
  >("all");
  const [assignmentFilter, setAssignmentFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const prefillSearch = searchParams.get("prefillSearch");

  useEffect(() => {
    if (!prefillSearch) return;

    setSearch(prefillSearch);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("prefillSearch");
      return next;
    }, { replace: true });
  }, [prefillSearch, setPage, setSearch, setSearchParams]);

  const schoolYearOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        children
          .map((child) => String(child.schoolYear || "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => b.localeCompare(a));
    return years;
  }, [children]);

  const centerOptions = useMemo(() => {
    const uniqueCenters = new Map<string, { id: string; label: string }>();

    children.forEach((child) => {
      const center = child.daycareCenter;
      if (!center?._id) return;

      if (!uniqueCenters.has(center._id)) {
        const barangay = String(center.barangay || "").trim();
        uniqueCenters.set(center._id, {
          id: center._id,
          label: barangay ? `${center.name} (${barangay})` : center.name,
        });
      }
    });

    return Array.from(uniqueCenters.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [children]);

  useEffect(() => {
    if (centerFilter === "all") return;
    const hasSelectedCenter = centerOptions.some(
      (center) => center.id === centerFilter,
    );
    if (!hasSelectedCenter) {
      setCenterFilter("all");
    }
  }, [centerFilter, centerOptions]);

  const filteredByControls = useMemo(() => {
    return filteredChildren.filter((child) => {
      if (statusFilter !== "all" && child.status !== statusFilter) {
        return false;
      }

      if (assignmentFilter !== "all") {
        const hasTeacher = Boolean(child.teacher);
        if (assignmentFilter === "assigned" && !hasTeacher) return false;
        if (assignmentFilter === "unassigned" && hasTeacher) return false;
      }

      if (centerFilter !== "all") {
        const centerId = String(child.daycareCenter?._id || "");
        if (centerId !== centerFilter) return false;
      }

      if (schoolYearFilter !== "all" && child.schoolYear !== schoolYearFilter) {
        return false;
      }

      return true;
    });
  }, [
    assignmentFilter,
    centerFilter,
    filteredChildren,
    schoolYearFilter,
    statusFilter,
  ]);

  const total = filteredByControls.length;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : page;
  const start = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const end = total === 0 ? 0 : Math.min(safePage * limit, total);
  const rangeLabel = `${start}-${end} of ${total}`;

  const pagedChildren = useMemo(() => {
    const sliceStart = (safePage - 1) * limit;
    return filteredByControls.slice(sliceStart, sliceStart + limit);
  }, [filteredByControls, limit, safePage]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    assignmentFilter !== "all" ||
    centerFilter !== "all" ||
    schoolYearFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setAssignmentFilter("all");
    setCenterFilter("all");
    setSchoolYearFilter("all");
    setPage(1);
  };

  const stats = useMemo(() => {
    const totalChildren = children.length;
    const active = children.filter((child) => child.status === "Active").length;
    const inactive = children.filter(
      (child) => child.status === "Inactive",
    ).length;
    const unassigned = children.filter((child) => !child.teacher).length;
    return { totalChildren, active, inactive, unassigned };
  }, [children]);

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
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
            Children Records
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            View and manage student information
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Total enrollment"
            value={String(stats.totalChildren)}
            subtitle={`${stats.active} active students`}
            icon={Users}
            color="blue"
          />
          <AdminStatCard
            title="Active"
            value={String(stats.active)}
            subtitle="Currently marked as Active"
            icon={UserCheck}
            color="teal"
          />
          <AdminStatCard
            title="Inactive"
            value={String(stats.inactive)}
            subtitle="Currently marked as Inactive"
            icon={UserX}
            color="rose"
          />
          <AdminStatCard
            title="Unassigned"
            value={String(stats.unassigned)}
            subtitle="Without an assigned teacher"
            icon={School}
            color="purple"
          />
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
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
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
                  <option value="all">All School Years</option>
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

          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-slate-700">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
              <span>{rangeLabel}</span>
              <select
                value={limit}
                onChange={(event) => {
                  setPage(1);
                  setLimit(Number(event.target.value));
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
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
                disabled={isLoading || safePage <= 1 || totalPages === 0}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Page {totalPages === 0 ? 0 : safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) =>
                    totalPages > 0 ? Math.min(totalPages, prev + 1) : prev,
                  )
                }
                disabled={isLoading || totalPages === 0 || safePage >= totalPages}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                Next
              </button>
            </div>
          </div>
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

      {openMenuUserId &&
        menuChild &&
        menuAnchorRect &&
        createPortal(
          <div
            className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
            style={{
              top: menuAnchorRect.bottom + 4,
              left: menuAnchorRect.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setStatusModalChild(menuChild as Child);
                setStatusModalValue((menuChild as Child).status || "Active");
                closeMenu();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ToggleLeft size={14} />
              Change Status
            </button>
            {(menuChild as Child).parent && (
              <button
                onClick={() => {
                  handleUnlinkParent(menuChild as Child);
                  closeMenu();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
              >
                <Unlink size={14} />
                Unlink Parent
              </button>
            )}
            <button
              onClick={async () => {
                closeMenu();
                setDeleteModalChild(menuChild as Child);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 size={14} />
              Delete Child
            </button>
          </div>,
          document.body,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                Change Status
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Update status for{" "}
                {`${statusModalChild.firstName} ${statusModalChild.lastName}`}.
              </p>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={statusModalValue}
                  onChange={(e) => setStatusModalValue(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStatusModalChild(null)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!statusModalChild) return;
                  await handleChangeStatus(statusModalChild, statusModalValue);
                  setStatusModalChild(null);
                }}
                className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                Delete Child
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Are you sure you want to delete{" "}
                {`${deleteModalChild.firstName} ${deleteModalChild.lastName}`}?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDeleteModalChild(null)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!deleteModalChild) return;
                  await handleDeleteChild(deleteModalChild);
                  setDeleteModalChild(null);
                }}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

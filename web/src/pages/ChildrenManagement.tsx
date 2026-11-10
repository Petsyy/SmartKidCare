import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import ChildDetailsModal from "@/features/children/components/ChildDetailsModal";
import { useChildrenManagement } from "@/features/children/hooks/useChildrenManagement";
import { useChildrenFilters } from "@/features/children/hooks/useChildrenFilters";
import { ChildrenTable } from "@/features/children/components/ChildrenTable";
import { ChildrenStatsGrid } from "@/features/children/components/ChildrenStatsGrid";
import { ChildrenFilterBar } from "@/features/children/components/ChildrenFilterBar";
import { getChildBlockchainProof, getChildDocumentUrl } from "@/api/child.api";
import type { Child, ChildBlockchainProof, ChildDocumentType } from "@/types/child";
import { useAuthSession } from "@/components/auth/useAuthSession";

const getCurrentSchoolYear = () => {
  const currentYear = Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(new Date()),
  );
  return `${currentYear}-${currentYear + 1}`;
};

export default function ChildrenManagement() {
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const { children, isLoading } = useChildrenManagement();

  const prefillSearch = searchParams.get("prefillSearch");

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page: safePage,
    setPage,
    limit,
    setLimit,
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
    if (user?.role === "barangay_captain") {
      setBlockchainProofLoading(false);
      return;
    }
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
      activeItem="monitoring/records"
      breadcrumbs={["Barangay Captain", "Daycare Records"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Daycare Records"
          subtitle="Read-only child records for Bonuan Sabangan"
        />

        <ChildrenStatsGrid isLoading={isLoading} stats={stats} />

        {/* Student Directory Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <ChildrenFilterBar
            schoolYear={getCurrentSchoolYear()}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setPage(1);
              setStatusFilter(val);
            }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          <ChildrenTable
            isLoading={isLoading}
            children={children}
            filteredChildren={pagedChildren}
            onViewChild={openViewModal}
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
    </Layout>
  );
}

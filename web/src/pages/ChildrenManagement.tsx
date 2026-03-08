import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Unlink, ToggleLeft, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import AddChildModal from "@/components/modals/child/AddChildModal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const {
    children,
    search,
    setSearch,
    isLoading,
    filteredChildren,
    handleSaveChild,
    handleChangeStatus,
    handleUnlinkParent,
    handleDeleteChild,
  } = useChildrenManagement();

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

        {/* Student Directory Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Card Header */}
          <div className="flex flex-col gap-4 border-b p-6 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Student Directory
              </h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-slate-700 dark:text-slate-200">
                {children.length} Enrolled
              </span>
            </div>

            <div className="flex gap-3">
              {/* Search */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
                />
              </div>

              {/* Add Child */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-teal-500/20 bg-linear-to-r from-teal-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-600 dark:border-cyan-400/20 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-500 dark:hover:to-cyan-500"
              >
                <Plus size={16} />
                Add Child
              </button>
            </div>
          </div>

          <ChildrenTable
            isLoading={isLoading}
            children={children}
            filteredChildren={filteredChildren}
            onViewChild={openViewModal}
            onEditChild={setEditingChild}
            onMenuClick={openMenu}
          />
        </div>
      </div>

      <AddChildModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (childData, files) => {
          if (!childData.studentId) {
            console.error("Student ID is required");
            return;
          }
          const success = await handleSaveChild(
            {
              ...childData,
              studentId: childData.studentId,
            },
            files,
          );
          if (success) {
            setIsModalOpen(false);
          }
        }}
      />

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
                handleChangeStatus(menuChild as Child);
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
                await handleDeleteChild(menuChild as Child);
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
    </Layout>
  );
}

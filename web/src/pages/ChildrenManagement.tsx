import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  X,
  Unlink,
  ToggleLeft,
  Trash2,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import AddChildModal from "@/components/modals/child/AddChildModal";
import EditChildModal, {
  type ChildForEdit,
} from "@/components/modals/child/EditChildModal";
import { useChildrenManagement } from "@/hooks/useChildrenManagement";
import { useContextMenu } from "@/hooks/useContextMenu";
import { ChildrenTable } from "@/components/ChildrenTable";
import { getChildDocumentUrl } from "@/api/child.api";

type ChildDocumentType = "birth-certificate" | "parent-id";

export type Child = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  age: string | number;
  studentId: string;
  schoolYear: string;
  status: string;
  enrollmentDate: string;
  dateOfBirth?: string | Date;
  parent?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null;
  teacher?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
  } | null;
  documents?: {
    birthCertificate?: {
      publicId?: string;
      resourceType?: string;
      format?: string;
    };
    parentId?: {
      publicId?: string;
      resourceType?: string;
      format?: string;
    };
  };
};

const formatDate = (value?: string | Date) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString();
};

const formatFullName = (
  firstName?: string,
  middleName?: string,
  lastName?: string,
) =>
  [firstName, middleName, lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

export default function ChildrenManagement() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [viewingChild, setViewingChild] = useState<Child | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
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
    setDocumentLoading(null);
  };

  const openViewModal = (child: Child) => {
    setViewingChild(child);
    setViewError(null);
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
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer"
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

      {viewingChild &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/55 p-4"
            onClick={closeViewModal}
          >
            <div
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Child Details
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Review profile and protected documents
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Name
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-slate-100">
                      {formatFullName(
                        viewingChild.firstName,
                        viewingChild.middleName,
                        viewingChild.lastName,
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Age / Gender
                      </p>
                      <p className="text-sm text-gray-900 dark:text-slate-100">
                        {viewingChild.age} years / {viewingChild.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </p>
                      <p
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          viewingChild.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {viewingChild.status}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Student ID
                    </p>
                    <p className="font-mono text-sm text-gray-900 dark:text-slate-100">
                      {viewingChild.studentId || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      School Year
                    </p>
                    <p className="text-sm text-gray-900 dark:text-slate-100">
                      {viewingChild.schoolYear || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Enrollment Date
                    </p>
                    <p className="text-sm text-gray-900 dark:text-slate-100">
                      {formatDate(viewingChild.enrollmentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date of Birth
                    </p>
                    <p className="text-sm text-gray-900 dark:text-slate-100">
                      {formatDate(viewingChild.dateOfBirth)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Parent
                    </p>
                    <p className="text-sm text-gray-900 dark:text-slate-100">
                      {viewingChild.parent
                        ? formatFullName(
                            viewingChild.parent.firstName,
                            viewingChild.parent.middleName,
                            viewingChild.parent.lastName,
                          )
                        : "Not linked"}
                    </p>
                    {viewingChild.parent?.email && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {viewingChild.parent.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Teacher
                    </p>
                    <p className="text-sm text-gray-900 dark:text-slate-100">
                      {viewingChild.teacher
                        ? formatFullName(
                            viewingChild.teacher.firstName,
                            viewingChild.teacher.middleName,
                            viewingChild.teacher.lastName,
                          )
                        : "Unassigned"}
                    </p>
                    {viewingChild.teacher?.email && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {viewingChild.teacher.email}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Protected Documents
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      Links are signed and expire in 60 seconds.
                    </p>
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument("birth-certificate")}
                        disabled={
                          documentLoading !== null ||
                          !viewingChild.documents?.birthCertificate?.publicId
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {documentLoading === "birth-certificate" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <FileText size={16} />
                        )}
                        View Birth Certificate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDocument("parent-id")}
                        disabled={
                          documentLoading !== null ||
                          !viewingChild.documents?.parentId?.publicId
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {documentLoading === "parent-id" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <FileText size={16} />
                        )}
                        View Parent ID
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                      Disabled buttons mean no document has been uploaded yet.
                    </p>
                  </div>

                  {viewError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {viewError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Layout>
  );
}

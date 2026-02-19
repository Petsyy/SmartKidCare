import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  RefreshCw,
  Unlink,
  ToggleLeft,
  Trash2,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import AddChildModal from "../components/modals/AddChildModal";
import EditChildModal, { type ChildForEdit } from "../components/modals/EditChildModal";
import { showViewChildModal } from "../utils/sweetalert.modal";
import { useChildrenManagement } from "../hooks/useChildrenManagement";
import { useContextMenu } from "../hooks/useContextMenu";
import { ChildrenTable } from "../components/ChildrenTable";

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
  childLinkCode?: string;
  parent?: { firstName: string; lastName: string; email: string } | null;
};

export default function ChildrenManagement() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const {
    children,
    search,
    setSearch,
    isLoading,
    filteredChildren,
    handleSaveChild,
    handleChangeStatus,
    handleRegenerateLinkCode,
    handleUnlinkParent,
    handleDeleteChild,
  } = useChildrenManagement();

  const { openMenuUserId, menuAnchorRect, menuUser: menuChild, openMenu, closeMenu } =
    useContextMenu();

  return (
    <Layout
      activeItem="children"
      breadcrumbs={["Admin", "Children Records"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="p-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Children Records
          </h1>
          <p className="text-sm text-gray-500">
            View and manage student information
          </p>
        </div>

        {/* Student Directory Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Student Directory
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
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
                  className="pl-10 pr-4 py-2 text-sm border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Add Child */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <Plus size={16} />
                Add Child
              </button>
            </div>
          </div>

          <ChildrenTable
            isLoading={isLoading}
            children={children}
            filteredChildren={filteredChildren}
            onViewChild={showViewChildModal}
            onEditChild={setEditingChild}
            onMenuClick={openMenu}
          />
        </div>
      </div>

      <AddChildModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (childData) => {
          if (!childData.studentId) {
            console.error("Student ID is required");
            return;
          }
          const success = await handleSaveChild({ ...childData, studentId: childData.studentId });
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

      {openMenuUserId && menuChild && menuAnchorRect &&
        createPortal(
          <div
            className="fixed py-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
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
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <ToggleLeft size={14} />
              Change Status
            </button>
            {!(menuChild as Child).parent && (
              <button
                onClick={() => {
                  handleRegenerateLinkCode(menuChild as Child);
                  closeMenu();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 transition"
              >
                <RefreshCw size={14} />
                Regenerate Link Code
              </button>
            )}
            {(menuChild as Child).parent && (
              <button
                onClick={() => {
                  handleUnlinkParent(menuChild as Child);
                  closeMenu();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
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
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={14} />
              Delete Child
            </button>
          </div>,
          document.body
        )}
    </Layout>
  );
}

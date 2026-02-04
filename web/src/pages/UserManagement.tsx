import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Plus, KeyRound, Power, Search } from "lucide-react";
import { type User } from "../api/authentication.api";
import AddTeacherModal from "../components/modals/AddTeacherModal";
import Layout from "../components/layout/Layout";
import { handleViewUser } from "../utils/sweetalert.modal";
import EditUserModal from "../components/modals/EditUserModal";
import { useUserManagement } from "../hooks/useUserManagement";
import { useContextMenu } from "../hooks/useContextMenu";
import { UserTable } from "../components/UserTable";

export default function UserManagement() {
  const navigate = useNavigate();
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    users,
    handleResetPassword,
    handleToggleStatus,
    handleViewChildren,
    fetchUsers,
  } = useUserManagement();

  const { openMenuUserId, menuAnchorRect, menuUser, openMenu, closeMenu } =
    useContextMenu();

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  return (
    <Layout
      activeItem="users"
      breadcrumbs={["Admin", "User Management"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage teacher and parent accounts
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("teacher")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "teacher"
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Teachers
          </button>

          <button
            onClick={() => setActiveTab("parent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "parent"
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Parents
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "teacher" ? "Teacher Accounts" : "Parent Accounts"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "teacher" ? "teachers" : "parents"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full sm:w-56 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {activeTab === "teacher" && (
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition shrink-0"
                >
                  <Plus size={16} />
                  Add Teacher
                </button>
              )}
            </div>
          </div>

          <UserTable
            activeTab={activeTab}
            isLoading={isLoading}
            users={users}
            filteredUsers={filteredUsers}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onViewChildren={handleViewChildren}
            onMenuClick={openMenu}
            openMenuUserId={openMenuUserId}
          />
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={fetchUsers}
          onDeleted={fetchUsers}
        />
      )}

      {openMenuUserId && menuUser && menuAnchorRect &&
        createPortal(
          <div
            className="fixed py-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            style={{
              top: menuAnchorRect.bottom + 4,
              left: menuAnchorRect.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                closeMenu();
                handleResetPassword(menuUser._id);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 transition"
            >
              <KeyRound size={14} />
              Reset password
            </button>
            <button
              onClick={() => {
                closeMenu();
                handleToggleStatus(menuUser);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Power size={14} />
              {menuUser.isActive === false ? "Activate" : "Deactivate"}
            </button>
          </div>,
          document.body
        )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <AddTeacherModal
          onClose={() => setShowAddTeacherModal(false)}
          onCreated={fetchUsers}
        />
      )}
    </Layout>
  );
}


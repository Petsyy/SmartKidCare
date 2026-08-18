import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { UserTabs } from "@/features/users/components/UserTabs";
import { ViewUserModal } from "@/features/users/components/ViewUserModal";
import { UserActionMenu } from "@/features/users/components/UserActionMenu";
import AddTeacherModal from "@/features/users/components/AddTeacherModal";
import EditUserModal from "@/features/users/components/EditUserModal";
import { DeleteUserModal } from "@/features/users/components/DeleteUserModal";
import { UserFilters } from "@/features/users/components/UserFilters";
import { UserTable } from "@/features/users/components/UserTable";
import { useUserManagement } from "@/features/users/hooks/useUserManagement";

export default function UserManagement() {
  const navigate = useNavigate();
  const {
    activeTab,
    showAddTeacherModal,
    editingUser,
    deletingUser,
    openMenuUserId,
    menuAnchorRect,
    menuUser,
    teacherCenterFilter,
    viewingUser,
    setActiveTab,
    setShowAddTeacherModal,
    setEditingUser,
    setDeletingUser,
    setViewingUser,
    setTeacherCenterFilter,

    users,
    filteredUsers,
    paginatedUsers,
    isLoading,
    errorMessage,
    fetchUsers,

    currentSearchQuery,
    currentStatusFilter,
    hasActiveFilters,
    currentPageSize,
    safeCurrentPage,
    totalPages,
    paginationRangeLabel,
    teacherCenterOptions,
    handleSearchChange,
    handleStatusFilterChange,
    handlePageSizeChange,
    handlePageChange,
    clearFilters,

    openMenu,
    closeMenu,
    handleEditUser,
    handleViewUser,
    handleResetPassword,
    handleToggleStatus,
    handleDeleteUser,
    confirmDeleteUser,
  } = useUserManagement();

  return (
    <Layout
      activeItem="users"
      breadcrumbs={["Admin", "User Management"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <PageHeader
          title="User Management"
          subtitle="Manage teacher and parent accounts"
        />

        <UserTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <ErrorAlert message={errorMessage} />

        {/* Table Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-800">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {activeTab === "teacher"
                  ? "Teacher Accounts"
                  : "Parent Accounts"}
              </h2>
              {activeTab === "teacher" && (
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-500/20 bg-linear-to-r from-teal-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-600 dark:border-cyan-400/20 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-500 dark:hover:to-cyan-500 lg:self-start cursor-pointer"
                >
                  <Plus size={16} />
                  Add Teacher
                </button>
              )}
            </div>

            <UserFilters
              activeTab={activeTab}
              hasActiveFilters={hasActiveFilters}
              resultCount={filteredUsers.length}
              currentSearchQuery={currentSearchQuery}
              onSearchChange={handleSearchChange}
              currentStatusFilter={currentStatusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              teacherCenterFilter={teacherCenterFilter}
              onTeacherCenterFilterChange={setTeacherCenterFilter}
              teacherCenterOptions={teacherCenterOptions}
              currentPageSize={currentPageSize}
              onPageSizeChange={handlePageSizeChange}
              onClearFilters={clearFilters}
            />
          </div>

          <UserTable
            activeTab={activeTab}
            isLoading={isLoading}
            usersLength={users.length}
            filteredUsersLength={filteredUsers.length}
            paginatedUsers={paginatedUsers}
            openMenuUserId={openMenuUserId}
            onOpenMenu={openMenu}
            onCloseMenu={closeMenu}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            paginationRangeLabel={paginationRangeLabel}
            safeCurrentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={async () => {
            await fetchUsers();
          }}
          onDeleted={async () => {
            await fetchUsers();
          }}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDelete={confirmDeleteUser}
        />
      )}

      <ViewUserModal
        user={viewingUser}
        onClose={() => setViewingUser(null)}
      />

      {openMenuUserId && menuUser && menuAnchorRect && (
        <UserActionMenu
          user={menuUser}
          anchorRect={menuAnchorRect}
          onClose={closeMenu}
          onResetPassword={handleResetPassword}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {showAddTeacherModal && (
        <AddTeacherModal
          onClose={() => setShowAddTeacherModal(false)}
          onCreated={async () => {
            await fetchUsers();
          }}
        />
      )}
    </Layout>
  );
}

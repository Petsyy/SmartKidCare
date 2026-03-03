import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Pencil,
  KeyRound,
  Power,
  Users,
  MoreVertical,
  Search,
  Baby,
  X,
} from "lucide-react";
import { getUsers, type User } from "@/api/authentication.api";
import AddTeacherModal from "@/components/modals/user/AddTeacherModal";
import AddChildForParentModal from "@/components/modals/child/AddChildForParentModal";
import Layout from "@/components/layout/Layout";
import {
  showErrorModal,
  showResetPasswordModal,
  showToggleUserStatusModal,
  showToggleUserStatusSuccessModal,
} from "@/utils/sweetalert.modal";
import {
  getParentChildren,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from "@/api/admin.api";
import Swal from "sweetalert2";
import { createChild } from "@/api/child.api";
import EditUserModal from "@/components/modals/user/EditUserModal";

interface Child {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"teacher" | "parent">("teacher");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [selectedParentForChild, setSelectedParentForChild] =
    useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingChildrenParentName, setViewingChildrenParentName] = useState<
    string | null
  >(null);
  const [viewingChildren, setViewingChildren] = useState<Child[]>([]);
  const [parentChildren, setParentChildren] = useState<Record<string, Child[]>>(
    {},
  );

  const MAX_TEACHERS = 2;
  const teacherCount = activeTab === "teacher" ? users.length : 0;
  const isTeacherLimitReached = teacherCount >= MAX_TEACHERS;

  const openMenu = (user: User, buttonEl: HTMLButtonElement) => {
    setMenuUser(user);
    setOpenMenuUserId(user._id);
    setMenuAnchorRect(buttonEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setOpenMenuUserId(null);
    setMenuAnchorRect(null);
    setMenuUser(null);
  };

  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    if (openMenuUserId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuUserId]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await resetUserPassword(userId);

      await showResetPasswordModal(res.credentials);
    } catch (err: any) {
      showErrorModal(err.message || "Failed to reset password");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const userName = `${user.firstName} ${user.middleName} ${user.lastName}`;
    const isActivating = user.isActive === false;
    const confirmed = await showToggleUserStatusModal({
      userName,
      isActivating,
    });
    if (!confirmed) return;
    try {
      await toggleUserStatus(user._id);
      await showToggleUserStatusSuccessModal({ userName, isActivating });
      fetchUsers(); // refresh table
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update account status");
    }
  };

  const handleAddChildForParent = (parent: User) => {
    setSelectedParentForChild(parent);
    setShowAddChildModal(true);
  };

  const handleSaveChildForParent = async (
    data: {
      parent: {
        firstName: string;
        middleName?: string;
        lastName: string;
        email: string;
      };
    } & {
      firstName: string;
      middleName: string;
      lastName: string;
      dateOfBirth: string;
      age: string;
      gender: string;
      enrollmentDate: string;
      schoolYear: string;
    },
  ) => {
    try {
      const p = data.parent;
      await createChild(
        {
          firstName: data.firstName,
          middleName: data.middleName || undefined,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          age: data.age,
          gender: data.gender,
          enrollmentDate: data.enrollmentDate,
          schoolYear: data.schoolYear,
          status: "Active",
          parentFirstName: p.firstName,
          parentLastName: p.lastName,
          parentMiddleName: p.middleName || undefined,
          parentEmail: p.email,
        },
        {},
      );
      setShowAddChildModal(false);
      setSelectedParentForChild(null);
      fetchUsers(); // Refresh to update the linked children
    } catch (err: any) {
      showErrorModal(err.message || "Failed to add child");
      throw err;
    }
  };

  const handleDeleteUser = async (user: User) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteUser(user._id);
      await Swal.fire({
        title: "Deleted",
        text: "User has been deleted",
        icon: "success",
        confirmButtonColor: "#0D9488",
      });
      fetchUsers();
    } catch (err: any) {
      showErrorModal(err.message || "Failed to delete user");
    }
  };

  const handleViewChildren = async (parentId: string, parentName: string) => {
    try {
      const children = await getParentChildren(parentId);
      setViewingChildren(children);
      setViewingChildrenParentName(parentName);
    } catch (err: any) {
      showErrorModal(err.message || "Failed to load children");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsers({ role: activeTab });
      setUsers(data);

      // Fetch children for each parent if activeTab is parent
      if (activeTab === "parent" && data.length > 0) {
        const childrenData: Record<string, Child[]> = {};
        await Promise.all(
          data.map(async (parent) => {
            try {
              const children = await getParentChildren(parent._id);
              childrenData[parent._id] = children;
            } catch (err) {
              childrenData[parent._id] = [];
            }
          }),
        );
        setParentChildren(childrenData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName =
      `${user.firstName} ${user.middleName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const phone = (user.phone || "").toLowerCase();
    return fullName.includes(q) || email.includes(q) || phone.includes(q);
  });

  return (
    <Layout
      activeItem="users"
      breadcrumbs={["Admin", "User Management"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage teacher and parent accounts
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("teacher")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "teacher"
                ? "border border-teal-200 bg-teal-50 text-teal-700 shadow-sm dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200"
                : "border border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-gray-50 dark:hover:text-gray-900"
            }`}
          >
            Teacher Accounts
          </button>

          <button
            onClick={() => setActiveTab("parent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "parent"
                ? "border border-teal-200 bg-teal-50 text-teal-700 shadow-sm dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200"
                : "border border-transparent text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800/60 dark:hover:text-gray-900 dark:text-slate-100"
            }`}
          >
            Parent Accounts
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {activeTab === "teacher" ? "Teacher Accounts" : "Parent Accounts"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "teacher" ? "teachers" : "parents"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 sm:w-56"
                />
              </div>
              {activeTab === "teacher" && (
                <button
                  onClick={() => {
                    if (!isTeacherLimitReached) {
                      setShowAddTeacherModal(true);
                    }
                  }}
                  disabled={isTeacherLimitReached}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition shrink-0 ${
                    isTeacherLimitReached
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  <Plus size={16} />
                  Add Teacher
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                    Phone
                  </th>
                  {activeTab === "parent" && (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                      Linked Child
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td
                      colSpan={activeTab === "parent" ? 6 : 5}
                      className="px-6 py-10 text-center text-gray-500 dark:text-slate-400"
                    >
                      Loading users...
                    </td>
                  </tr>
                )}

                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={activeTab === "parent" ? 6 : 5}
                      className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                    >
                      No {activeTab === "teacher" ? "teachers" : "parents"}{" "}
                      found.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  users.length > 0 &&
                  filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={activeTab === "parent" ? 6 : 5}
                        className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                      >
                        No {activeTab === "teacher" ? "teachers" : "parents"}{" "}
                        match your search.
                      </td>
                    </tr>
                  )}

                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                      {user.lastName}, {user.firstName} {user.middleName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                      {user.phone || "-"}
                    </td>
                    {activeTab === "parent" && (
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {parentChildren[user._id] &&
                        parentChildren[user._id].length > 0 ? (
                          <div className="space-y-1">
                            {parentChildren[user._id].map((child) => (
                              <div key={child._id} className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-slate-100">
                                  {child.firstName}{" "}
                                  {child.middleName
                                    ? child.middleName + " "
                                    : ""}
                                  {child.lastName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                  ID: {child.studentId}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">
                            No linked children
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive !== false
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                        }`}
                      >
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40"
                          title="View"
                        >
                          <Eye
                            size={14}
                            className="transition-transform duration-200 group-hover:scale-110"
                          />
                          View
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                          title="Edit"
                        >
                          <Pencil
                            size={14}
                            className="transition-transform duration-200 group-hover:-rotate-6"
                          />
                          Edit
                        </button>
                        {activeTab === "parent" && (
                          <button
                            onClick={() => {
                              const parentName =
                                `${user.firstName} ${user.middleName || ""} ${user.lastName}`
                                  .replace(/\s+/g, " ")
                                  .trim();
                              handleViewChildren(user._id, parentName);
                            }}
                            className="group inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                            title="View children"
                          >
                            <Users
                              size={14}
                              className="transition-transform duration-200 group-hover:scale-110"
                            />
                            Children
                          </button>
                        )}
                        <div className="inline-block shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuUserId === user._id) {
                                closeMenu();
                              } else {
                                openMenu(user, e.currentTarget);
                              }
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                            title="More actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {viewingUser && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => setViewingUser(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                User Details
              </h3>
              <button
                onClick={() => setViewingUser(null)}
                className="rounded-md p-2 text-gray-500 transition hover:bg-white hover:text-gray-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5 text-sm">
              <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-700/30 dark:bg-teal-900/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  {`${viewingUser.firstName?.[0] || ""}${viewingUser.lastName?.[0] || ""}`}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                    Full Name
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                    {viewingUser.firstName} {viewingUser.middleName || ""}{" "}
                    {viewingUser.lastName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 break-all text-gray-900 dark:text-slate-100">
                    {viewingUser.email}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1 text-gray-900 dark:text-slate-100">
                    {viewingUser.phone || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Role
                  </p>
                  <p className="mt-1 capitalize text-gray-900 dark:text-slate-100">
                    {viewingUser.role}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      viewingUser.isActive !== false
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {viewingUser.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingChildrenParentName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Linked Children
              </h3>
              <button
                onClick={() => {
                  setViewingChildrenParentName(null);
                  setViewingChildren([]);
                }}
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="mb-3 text-sm text-gray-600 dark:text-slate-300">
                Parent:{" "}
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                  {viewingChildrenParentName}
                </span>
              </p>
              {viewingChildren.length > 0 ? (
                <div className="space-y-3">
                  {viewingChildren.map((child) => (
                    <div
                      key={child._id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {child.firstName} {child.middleName || ""}{" "}
                        {child.lastName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        Student ID: {child.studentId}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-500">
                  No linked children.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {openMenuUserId &&
        menuUser &&
        menuAnchorRect &&
        createPortal(
          <div
            className="fixed z-50 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
            style={{
              top: menuAnchorRect.bottom + 4,
              left: menuAnchorRect.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeTab === "parent" && (
              <button
                onClick={() => {
                  closeMenu();
                  handleAddChildForParent(menuUser);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-teal-700 transition hover:bg-teal-50 dark:hover:bg-teal-500/10"
              >
                <Baby size={14} />
                Add Child
              </button>
            )}
            <button
              onClick={() => {
                closeMenu();
                handleResetPassword(menuUser._id);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 transition hover:bg-amber-50 dark:hover:bg-amber-500/10"
            >
              <KeyRound size={14} />
              Reset password
            </button>
            <button
              onClick={() => {
                closeMenu();
                handleToggleStatus(menuUser);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Power size={14} />
              {menuUser.isActive === false ? "Activate" : "Deactivate"}
            </button>
            <button
              onClick={() => {
                closeMenu();
                handleDeleteUser(menuUser);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                />
              </svg>
              Delete user
            </button>
          </div>,
          document.body,
        )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <AddTeacherModal
          onClose={() => setShowAddTeacherModal(false)}
          onCreated={fetchUsers}
        />
      )}

      {/* Add Child for Existing Parent Modal */}
      {showAddChildModal && selectedParentForChild && (
        <AddChildForParentModal
          isOpen={showAddChildModal}
          parent={{
            firstName: selectedParentForChild.firstName,
            middleName: selectedParentForChild.middleName,
            lastName: selectedParentForChild.lastName,
            email: selectedParentForChild.email,
          }}
          onClose={() => {
            setShowAddChildModal(false);
            setSelectedParentForChild(null);
          }}
          onSave={handleSaveChildForParent}
        />
      )}
    </Layout>
  );
}

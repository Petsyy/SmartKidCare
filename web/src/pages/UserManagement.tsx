import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Pencil,
  KeyRound,
  Power,
  MoreVertical,
  Search,
  X,
} from "lucide-react";
import { getUsers, type User } from "@/api/authentication.api";
import AddTeacherModal from "@/components/modals/add-teacher-modal";
import Layout from "@/components/layout/Layout";
import {
  showErrorModal,
  showResetPasswordModal,
  showToggleUserStatusModal,
  showToggleUserStatusSuccessModal,
} from "@/utils/sweetAlertModal";
import {
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
  getParentChildren,
  type ParentLinkedChildItem,
} from "@/api/admin.api";
import Swal from "sweetalert2";
import EditUserModal from "@/components/modals/edit-user-modal";
import { formatConfidentialName } from "@/utils/namePrivacy";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useUserManagementStore } from "@/stores/user-management.store";
import { webQueryKeys } from "@/lib/query-keys";

type AccountStatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getUserFullName = (user: User) =>
  `${user.firstName} ${user.middleName || ""} ${user.lastName}`
    .replace(/\s+/g, " ")
    .trim();

const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 10000) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Request timeout"));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });

export default function UserManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const {
    activeTab,
    showAddTeacherModal,
    editingUser,
    openMenuUserId,
    menuAnchorRect,
    menuUser,
    teacherSearchQuery,
    parentSearchQuery,
    teacherStatusFilter,
    parentStatusFilter,
    teacherCenterFilter,
    teacherPage,
    parentPage,
    teacherPageSize,
    parentPageSize,
    viewingUser,
    setActiveTab,
    setShowAddTeacherModal,
    setEditingUser,
    setOpenMenuUserId,
    setMenuAnchorRect,
    setMenuUser,
    setTeacherSearchQuery,
    setParentSearchQuery,
    setTeacherStatusFilter,
    setParentStatusFilter,
    setTeacherCenterFilter,
    setTeacherPage,
    setParentPage,
    setTeacherPageSize,
    setParentPageSize,
    setViewingUser,
  } = useUserManagementStore();
  const [parentChildrenByUserId, setParentChildrenByUserId] = useState<
    Record<string, ParentLinkedChildItem[]>
  >({});
  const [parentChildrenLoadingByUserId, setParentChildrenLoadingByUserId] =
    useState<Record<string, boolean>>({});

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const {
    data: users = [],
    isLoading,
    error,
    refetch: fetchUsers,
  } = useQuery({
    queryKey: webQueryKeys.users(activeTab),
    queryFn: () => getUsers({ role: activeTab }),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => resetUserPassword(userId),
  });
  const toggleStatusMutation = useMutation({
    mutationFn: (userId: string) => toggleUserStatus(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webQueryKeys.usersRoot() });
    },
  });
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webQueryKeys.usersRoot() });
    },
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await resetPasswordMutation.mutateAsync(userId);

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
      await toggleStatusMutation.mutateAsync(user._id);
      await showToggleUserStatusSuccessModal({ userName, isActivating });
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update account status");
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
      await deleteUserMutation.mutateAsync(user._id);
      await Swal.fire({
        title: "Deleted",
        text: "User has been deleted",
        icon: "success",
        confirmButtonColor: "#0D9488",
      });
    } catch (err: any) {
      showErrorModal(err.message || "Failed to delete user");
    }
  };
  const errorMessage = error instanceof Error ? error.message : null;

  const handleSearchChange = (value: string) => {
    if (activeTab === "teacher") {
      setTeacherPage(1);
      setTeacherSearchQuery(value);
      return;
    }

    setParentPage(1);
    setParentSearchQuery(value);
  };

  const handleStatusFilterChange = (value: AccountStatusFilter) => {
    if (activeTab === "teacher") {
      setTeacherPage(1);
      setTeacherStatusFilter(value);
      return;
    }

    setParentPage(1);
    setParentStatusFilter(value);
  };

  const handlePageSizeChange = (value: number) => {
    if (activeTab === "teacher") {
      setTeacherPage(1);
      setTeacherPageSize(value);
      return;
    }

    setParentPage(1);
    setParentPageSize(value);
  };

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.max(1, Math.min(nextPage, totalPages));
    if (activeTab === "teacher") {
      setTeacherPage(boundedPage);
      return;
    }

    setParentPage(boundedPage);
  };

  const clearFilters = () => {
    if (activeTab === "teacher") {
      setTeacherSearchQuery("");
      setTeacherStatusFilter("all");
      setTeacherCenterFilter("all");
      setTeacherPage(1);
      return;
    }

    setParentSearchQuery("");
    setParentStatusFilter("all");
    setParentPage(1);
  };

  const teacherCenterOptions = Array.from(
    new Map(
      users
        .filter((user) => Boolean(user.daycareCenter?._id))
        .map((user) => [
          user.daycareCenter!._id,
          user.daycareCenter as NonNullable<User["daycareCenter"]>,
        ]),
    ).values(),
  ).sort((left, right) =>
    `${left.barangay} ${left.name}`.localeCompare(
      `${right.barangay} ${right.name}`,
    ),
  );

  const filteredUsers = users.filter((user) => {
    const searchQuery =
      activeTab === "teacher" ? teacherSearchQuery : parentSearchQuery;
    const statusFilter =
      activeTab === "teacher" ? teacherStatusFilter : parentStatusFilter;
    const q = searchQuery.trim().toLowerCase();
    const fullName = getUserFullName(user).toLowerCase();
    const email = user.email.toLowerCase();
    const phone = (user.phone || "").toLowerCase();

    if (q) {
      const searchableValues = [fullName, email, phone];
      if (activeTab === "teacher") {
        searchableValues.push(
          user.daycareCenter?.name?.toLowerCase() || "",
          user.daycareCenter?.barangay?.toLowerCase() || "",
        );
      }

      const matchesSearch = searchableValues.some((value) => value.includes(q));
      if (!matchesSearch) return false;
    }

    if (statusFilter === "active" && user.isActive === false) return false;
    if (statusFilter === "inactive" && user.isActive !== false) return false;

    if (activeTab === "teacher") {
      if (teacherCenterFilter === "assigned" && !user.daycareCenter) {
        return false;
      }
      if (teacherCenterFilter === "unassigned" && user.daycareCenter) {
        return false;
      }
      if (
        teacherCenterFilter !== "all" &&
        teacherCenterFilter !== "assigned" &&
        teacherCenterFilter !== "unassigned" &&
        user.daycareCenter?._id !== teacherCenterFilter
      ) {
        return false;
      }
    }

    return true;
  });

  const currentPage = activeTab === "teacher" ? teacherPage : parentPage;
  const currentPageSize =
    activeTab === "teacher" ? teacherPageSize : parentPageSize;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / currentPageSize || 1),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * currentPageSize,
    safeCurrentPage * currentPageSize,
  );
  const currentSearchQuery =
    activeTab === "teacher" ? teacherSearchQuery : parentSearchQuery;
  const currentStatusFilter =
    activeTab === "teacher" ? teacherStatusFilter : parentStatusFilter;
  const hasActiveFilters =
    Boolean(currentSearchQuery.trim()) ||
    currentStatusFilter !== "all" ||
    (activeTab === "teacher" && teacherCenterFilter !== "all");
  const paginationRangeLabel =
    filteredUsers.length === 0
      ? "0 of 0"
      : `${(safeCurrentPage - 1) * currentPageSize + 1}-${Math.min(
        safeCurrentPage * currentPageSize,
        filteredUsers.length,
      )} of ${filteredUsers.length}`;

  const maskChildName = (child: ParentLinkedChildItem) =>
    formatConfidentialName({
      lastName: child.lastName,
      firstName: child.firstName,
      middleName: child.middleName,
    }) || "Unknown";

  useEffect(() => {
    if (activeTab !== "parent") return;

    const parentIds = paginatedUsers.map((user) => user._id).filter(Boolean);
    const missingParentIds = parentIds.filter(
      (parentId) =>
        parentChildrenByUserId[parentId] === undefined &&
        !parentChildrenLoadingByUserId[parentId],
    );

    if (!missingParentIds.length) return;

    setParentChildrenLoadingByUserId((prev) => {
      const next = { ...prev };
      let hasChanges = false;
      missingParentIds.forEach((parentId) => {
        if (!next[parentId]) {
          next[parentId] = true;
          hasChanges = true;
        }
      });
      return hasChanges ? next : prev;
    });

    missingParentIds.forEach((parentId) => {
      void (async () => {
        let linkedChildren: ParentLinkedChildItem[] = [];
        try {
          linkedChildren = await withTimeout(getParentChildren(parentId), 10000);
        } catch {
          linkedChildren = [];
        }

        if (!isMountedRef.current) return;

        setParentChildrenByUserId((prev) => {
          if (prev[parentId] === linkedChildren) return prev;
          return {
            ...prev,
            [parentId]: linkedChildren,
          };
        });

        setParentChildrenLoadingByUserId((prev) => {
          if (!prev[parentId]) return prev;
          return {
            ...prev,
            [parentId]: false,
          };
        });
      })();
    });
  }, [
    activeTab,
    paginatedUsers,
    parentChildrenByUserId,
    parentChildrenLoadingByUserId,
  ]);

  const tableColumnCount = activeTab === "teacher" ? 6 : 6;

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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "teacher"
                ? "border border-teal-200 bg-teal-50 text-teal-700 shadow-sm hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/55"
                : "border border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 cursor-pointer"
              }`}
          >
            Teacher Accounts
          </button>

          <button
            onClick={() => setActiveTab("parent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "parent"
                ? "border border-teal-200 bg-teal-50 text-teal-700 shadow-sm hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/55"
                : "border border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 cursor-pointer"
              }`}
          >
            Parent Accounts
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-800">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {activeTab === "teacher" ? "Teacher Accounts" : "Parent Accounts"}
              </h2>
              {activeTab === "teacher" && (
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-500/20 bg-linear-to-r from-teal-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-600 dark:border-cyan-400/20 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-500 dark:hover:to-cyan-500 lg:self-start"
                >
                  <Plus size={16} />
                  Add Teacher
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative min-w-55 flex-1 sm:max-w-xs">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab === "teacher" ? "teachers" : "parents"}...`}
                    value={currentSearchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <select
                  value={currentStatusFilter}
                  onChange={(e) =>
                    handleStatusFilterChange(
                      e.target.value as AccountStatusFilter,
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {activeTab === "teacher" && (
                  <select
                    value={teacherCenterFilter}
                    onChange={(e) => {
                      setTeacherPage(1);
                      setTeacherCenterFilter(e.target.value);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Centers</option>
                    <option value="assigned">Assigned Only</option>
                    <option value="unassigned">Unassigned</option>
                    {teacherCenterOptions.map((center) => (
                      <option key={center._id} value={center._id}>
                        {center.barangay} - {center.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={String(currentPageSize)}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 xl:justify-end">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {filteredUsers.length} result
                  {filteredUsers.length === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              </div>
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
                      Child Name
                    </th>
                  )}
                  {activeTab === "teacher" && (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">
                      Assigned Center
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
                      colSpan={tableColumnCount}
                      className="px-6 py-10 text-center text-gray-500 dark:text-slate-400"
                    >
                      Loading users...
                    </td>
                  </tr>
                )}

                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableColumnCount}
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
                        colSpan={tableColumnCount}
                        className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                      >
                        No {activeTab === "teacher" ? "teachers" : "parents"}{" "}
                        match your search.
                      </td>
                    </tr>
                  )}

                {paginatedUsers.map((user) => (
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
                        {parentChildrenLoadingByUserId[user._id] ? (
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            Loading...
                          </span>
                        ) : (parentChildrenByUserId[user._id] || []).length === 0 ? (
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            No linked child
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(parentChildrenByUserId[user._id] || []).map((child) => (
                              <button
                                key={`${user._id}-${child._id}-${child.studentId || "no-id"}`}
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/children?prefillSearch=${encodeURIComponent(
                                      child.studentId ||
                                      `${child.lastName} ${child.firstName}`,
                                    )}`,
                                  )
                                }
                                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs text-teal-700 transition hover:border-teal-300 hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/35"
                                title="Open in Child Table"
                              >
                                <span className="font-mono">
                                  {child.studentId || "No ID"}
                                </span>
                                <span>{maskChildName(child)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                    {activeTab === "teacher" && (
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {user.daycareCenter ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-slate-100">
                              {user.daycareCenter.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {user.daycareCenter.barangay}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${user.isActive !== false
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
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40 cursor-pointer"
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
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil
                            size={14}
                            className="transition-transform duration-200 group-hover:-rotate-6"
                          />
                          Edit
                        </button>
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
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 cursor-pointer"
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

          <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Showing {paginationRangeLabel}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage <= 1 || filteredUsers.length === 0}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <span className="px-2 text-sm text-gray-600 dark:text-slate-300">
                Page {filteredUsers.length === 0 ? 0 : safeCurrentPage} of{" "}
                {filteredUsers.length === 0 ? 0 : totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={
                  filteredUsers.length === 0 || safeCurrentPage >= totalPages
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
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
                {viewingUser.role === "teacher" && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Assigned Center
                    </p>
                    <p className="mt-1 text-gray-900 dark:text-slate-100">
                      {viewingUser.daycareCenter?.name || "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {viewingUser.daycareCenter?.barangay || "-"}
                    </p>
                  </div>
                )}
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${viewingUser.isActive !== false
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

      {openMenuUserId &&
        menuUser &&
        menuAnchorRect &&
        createPortal(
          <div
            className="fixed z-50 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900 cursor-pointer"
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 transition hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer"
            >
              <KeyRound size={14} />
              Reset password
            </button>
            <button
              onClick={() => {
                closeMenu();
                handleToggleStatus(menuUser);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Power size={14} />
              {menuUser.isActive === false ? "Activate" : "Deactivate"}
            </button>
            <button
              onClick={() => {
                closeMenu();
                handleDeleteUser(menuUser);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
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
          onCreated={async () => {
            await fetchUsers();
          }}
        />
      )}
    </Layout>
  );
}

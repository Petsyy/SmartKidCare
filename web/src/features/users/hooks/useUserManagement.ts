import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, type User } from "@/api/authentication.api";
import { toggleUserStatus, resetUserPassword, deleteUser, getParentChildren, type ParentLinkedChildItem } from "@/api/admin.api";
import { webQueryKeys } from "@/lib/query-keys";
import { useUserManagementStore } from "@/stores/user-management.store";
import { showErrorModal, showResetPasswordModal, showToggleUserStatusModal, showToggleUserStatusSuccessModal } from "@/utils/sweet-alert-modal";
import { formatConfidentialName } from "@/utils/name-privacy";

export type AccountStatusFilter = "all" | "active" | "inactive";
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

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

export function useUserManagement() {
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const {
    activeTab,
    showAddTeacherModal,
    editingUser,
    deletingUser,
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
    setDeletingUser,
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
      await queryClient.invalidateQueries({
        queryKey: webQueryKeys.usersRoot(),
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: webQueryKeys.usersRoot(),
      });
    },
  });

  const handleEditUser = (user: User) => setEditingUser(user);
  const handleViewUser = (user: User) => setViewingUser(user);

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await resetPasswordMutation.mutateAsync(userId);
      if (res.credentials) {
        await showResetPasswordModal(res.credentials);
      }
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

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    closeMenu();
  };

  const confirmDeleteUser = async (user: User) => {
    await deleteUserMutation.mutateAsync(user._id);
  };

  const errorMessage = error instanceof Error ? error.message : null;

  const handleSearchChange = (value: string) => {
    if (activeTab === "teacher") {
      setTeacherPage(1);
      setTeacherSearchQuery(value);
    } else {
      setParentPage(1);
      setParentSearchQuery(value);
    }
  };

  const handleStatusFilterChange = (value: AccountStatusFilter) => {
    if (activeTab === "teacher") {
      setTeacherPage(1);
      setTeacherStatusFilter(value);
    } else {
      setParentPage(1);
      setParentStatusFilter(value);
    }
  };

  const handlePageSizeChange = (value: number) => {
    if (activeTab === "teacher") {
      setTeacherPage(1);
      setTeacherPageSize(value);
    } else {
      setParentPage(1);
      setParentPageSize(value);
    }
  };

  const clearFilters = () => {
    if (activeTab === "teacher") {
      setTeacherSearchQuery("");
      setTeacherStatusFilter("all");
      setTeacherCenterFilter("all");
      setTeacherPage(1);
    } else {
      setParentSearchQuery("");
      setParentStatusFilter("all");
      setParentPage(1);
    }
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
      if (teacherCenterFilter === "assigned" && !user.daycareCenter)
        return false;
      if (teacherCenterFilter === "unassigned" && user.daycareCenter)
        return false;
      if (
        teacherCenterFilter !== "all" &&
        teacherCenterFilter !== "assigned" &&
        teacherCenterFilter !== "unassigned" &&
        user.daycareCenter?._id !== teacherCenterFilter
      )
        return false;
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

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.max(1, Math.min(nextPage, totalPages));
    if (activeTab === "teacher") setTeacherPage(boundedPage);
    else setParentPage(boundedPage);
  };

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
          linkedChildren = await withTimeout(
            getParentChildren(parentId),
            10000,
          );
        } catch {
          linkedChildren = [];
        }

        if (!isMountedRef.current) return;

        setParentChildrenByUserId((prev) => {
          if (prev[parentId] === linkedChildren) return prev;
          return { ...prev, [parentId]: linkedChildren };
        });

        setParentChildrenLoadingByUserId((prev) => {
          if (!prev[parentId]) return prev;
          return { ...prev, [parentId]: false };
        });
      })();
    });
  }, [
    activeTab,
    paginatedUsers,
    parentChildrenByUserId,
    parentChildrenLoadingByUserId,
  ]);

  return {
    // State from store
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
    setViewingUser,
    setTeacherCenterFilter,

    // Data and Status
    users,
    filteredUsers,
    paginatedUsers,
    isLoading,
    errorMessage,
    fetchUsers,

    // Filters and Pagination
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

    // Modals and Menus
    openMenu,
    closeMenu,
    handleEditUser,
    handleViewUser,
    handleResetPassword,
    handleToggleStatus,
    handleDeleteUser,
    confirmDeleteUser,
    setDeletingUser,

    // Parent Children Logic
    parentChildrenLoadingByUserId,
    parentChildrenByUserId,
    maskChildName
  };
}

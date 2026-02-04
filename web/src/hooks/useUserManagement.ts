import { useState, useEffect } from "react";
import { getUsers, type User } from "../api/authentication.api";
import { getParentChildren, toggleUserStatus, resetUserPassword } from "../api/admin.api";
import {
  showErrorModal,
  showResetPasswordModal,
  showToggleUserStatusModal,
  showToggleUserStatusSuccessModal,
  showLinkedChildrenModal,
} from "../utils/sweetalert.modal";

export function useUserManagement() {
  const [activeTab, setActiveTab] = useState<"teacher" | "parent">("teacher");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsers({ role: activeTab });
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

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
    const confirmed = await showToggleUserStatusModal({ userName, isActivating });
    if (!confirmed) return;
    try {
      await toggleUserStatus(user._id);
      await showToggleUserStatusSuccessModal({ userName, isActivating });
      fetchUsers();
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update account status");
    }
  };

  const handleViewChildren = async (parentId: string, parentName: string) => {
    try {
      const children = await getParentChildren(parentId);
      showLinkedChildrenModal(children, parentName);
    } catch (err: any) {
      showErrorModal(err.message || "Failed to load children");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${user.firstName} ${user.middleName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const employeeId = (user.employeeId || "").toLowerCase();
    return fullName.includes(q) || email.includes(q) || employeeId.includes(q);
  });

  return {
    activeTab,
    setActiveTab,
    users,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    handleResetPassword,
    handleToggleStatus,
    handleViewChildren,
    fetchUsers,
  };
}

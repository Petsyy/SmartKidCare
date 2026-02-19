import { useState, useEffect } from "react";
import { type Child } from "../pages/ChildrenManagement";
import Swal from "sweetalert2";
import { deleteChild, getChildren, updateChild } from "../api/child.api";
import { API_BASE } from "../components/config/config.api";
import {
  showErrorModal,
  showChangeChildStatusModal,
  showRegenerateLinkCodeConfirm,
  showUnlinkParentConfirm,
  showParentCredentialsModal,
} from "../utils/sweetalert.modal";

export type ChildFormData = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  age: number | string;
  studentId: string;
  schoolYear: string;
  dateOfBirth?: string;
};

export function useChildrenManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchChildren = async () => {
    setIsLoading(true);
    try {
      const data = await getChildren();
      setChildren(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch children:", error);
      setChildren([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleSaveChild = async (childData: ChildFormData) => {
    try {
      const res = await fetch(`${API_BASE}/children`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...childData,
          status: "Active",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data as { message?: string }).message || "Failed to save child");
      }

      const { child, parentCredentials } = data;

      await fetchChildren();

      if (parentCredentials) {
        const creds = {
          email: parentCredentials.email ?? "",
          password: parentCredentials.tempPassword ?? "",
          childLinkCode: parentCredentials.childLinkCode ?? child?.childLinkCode ?? null,
        };
        setTimeout(() => showParentCredentialsModal(creds), 350);
      }

      return true;
    } catch (error) {
      console.error("Failed to save child:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save child";
      showErrorModal(errorMessage);
      return false;
    }
  };

  const handleChangeStatus = async (child: Child) => {
    const newStatus = await showChangeChildStatusModal(
      `${child.firstName} ${child.lastName}`,
      child.status
    );
    if (!newStatus) return;
    try {
      const updated = await updateChild(child._id, { status: newStatus });
      setChildren((prev) => prev.map((c) => (c._id === child._id ? updated : c)));
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update status");
    }
  };

  const handleRegenerateLinkCode = async (child: Child) => {
    if (child.parent) {
      showErrorModal("Cannot regenerate link code: child is linked to a parent. Unlink first.");
      return;
    }
    const ok = await showRegenerateLinkCodeConfirm(`${child.firstName} ${child.lastName}`);
    if (!ok) return;
    try {
      const updated = await updateChild(child._id, { regenerateLinkCode: true });
      setChildren((prev) => prev.map((c) => (c._id === child._id ? updated : c)));
    } catch (err: any) {
      showErrorModal(err.message || "Failed to regenerate link code");
    }
  };

  const handleUnlinkParent = async (child: Child) => {
    if (!child.parent) {
      showErrorModal("Child has no linked parent.");
      return;
    }
    const ok = await showUnlinkParentConfirm(`${child.firstName} ${child.lastName}`);
    if (!ok) return;
    try {
      const updated = await updateChild(child._id, { unlinkParent: true });
      setChildren((prev) => prev.map((c) => (c._id === child._id ? updated : c)));
    } catch (err: any) {
      showErrorModal(err.message || "Failed to unlink parent");
    }
  };

  const handleDeleteChild = async (child: Child) => {
    const result = await Swal.fire({
      title: "Delete Child?",
      text: `Are you sure you want to delete ${child.firstName} ${child.lastName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteChild(child._id);
      setChildren((prev) => prev.filter((item) => item._id !== child._id));

      await Swal.fire({
        title: "Deleted",
        text: "Child has been deleted successfully.",
        icon: "success",
        confirmButtonColor: "#0D9488",
      });
    } catch (err: any) {
      showErrorModal(err.message || "Failed to delete child");
    }
  };

  const filteredChildren = children.filter((child) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const name = `${child.firstName} ${child.lastName} ${child.middleName || ""}`.toLowerCase();
    const studentId = (child.studentId || "").toLowerCase();
    return name.includes(q) || studentId.includes(q);
  });

  return {
    children,
    setChildren,
    search,
    setSearch,
    isLoading,
    filteredChildren,
    fetchChildren,
    handleSaveChild,
    handleChangeStatus,
    handleRegenerateLinkCode,
    handleUnlinkParent,
    handleDeleteChild,
  };
}

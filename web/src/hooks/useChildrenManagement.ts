import { useMemo, useState } from "react";
import type { Child } from "@/types/child";
import {
  deleteChild,
  getChildren,
  updateChild,
} from "../api/child.api";
import { showErrorModal } from "../utils/sweetAlertModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";

export function useChildrenManagement() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const {
    data: children = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: webQueryKeys.children(),
    queryFn: async () => {
      const data = await getChildren();
      return Array.isArray(data) ? data : [];
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: ({ childId, payload }: { childId: string; payload: any }) =>
      updateChild(childId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webQueryKeys.children() });
    },
  });
  const deleteChildMutation = useMutation({
    mutationFn: (childId: string) => deleteChild(childId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webQueryKeys.children() });
    },
  });

  const handleChangeStatus = async (child: Child, newStatus: string) => {
    if (!newStatus) return;
    try {
      await updateChildMutation.mutateAsync({
        childId: child._id,
        payload: { status: newStatus },
      });
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update status");
    }
  };

  const handleUnlinkParent = async (child: Child) => {
    if (!child.parent) {
      showErrorModal("Child has no linked parent.");
      return;
    }
    try {
      await updateChildMutation.mutateAsync({
        childId: child._id,
        payload: { unlinkParent: true },
      });
    } catch (err: any) {
      showErrorModal(err.message || "Failed to unlink parent");
    }
  };

  const handleDeleteChild = async (child: Child) => {
    try {
      await deleteChildMutation.mutateAsync(child._id);
    } catch (err: any) {
      showErrorModal(err.message || "Failed to delete child");
    }
  };

  const filteredChildren = useMemo(
    () =>
      children.filter((child) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        const studentId = (child.studentId || "").toLowerCase();
        const age = String(child.age ?? "").toLowerCase();
        const gender = (child.gender || "").toLowerCase();
        const schoolYear = (child.schoolYear || "").toLowerCase();
        const status = (child.status || "").toLowerCase();
        const teacherName = child.teacher
          ? `${child.teacher.firstName} ${child.teacher.middleName || ""} ${child.teacher.lastName}`.toLowerCase()
          : "";
        const centerName = (child.daycareCenter?.name || "").toLowerCase();
        const centerBarangay = (child.daycareCenter?.barangay || "").toLowerCase();
        return (
          studentId.includes(q) ||
          age.includes(q) ||
          gender.includes(q) ||
          schoolYear.includes(q) ||
          status.includes(q) ||
          teacherName.includes(q) ||
          centerName.includes(q) ||
          centerBarangay.includes(q)
        );
      }),
    [children, search],
  );

  return {
    children,
    search,
    setSearch,
    isLoading,
    filteredChildren,
    fetchChildren: refetch,
    handleChangeStatus,
    handleUnlinkParent,
    handleDeleteChild,
  };
}

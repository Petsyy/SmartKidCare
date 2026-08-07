
import type { Child } from "@/types/child";
import { getChildren, deleteChild, updateChild } from "@/api/child.api";
import { showErrorModal } from "@/utils/sweet-alert-modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";

export function useChildrenManagement() {
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

  return {
    children,
    isLoading,
    fetchChildren: refetch,
    handleChangeStatus,
    handleUnlinkParent,
    handleDeleteChild,
  };
}

import { useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { deleteEnrollmentRequest, getEnrollmentRequests, reviewEnrollmentRequest, type EnrollmentRequestItem, } from "@/api/admin.api";
import { showErrorModal, showParentCredentialsModal, } from "@/utils/sweet-alert-modal";
import { useEnrollmentRequestsStore } from "@/stores/enrollment-requests.store";
import { webQueryKeys } from "@/lib/query-keys";

export const formatSubmissionId = (value: string) =>
  `ER-${String(value || "").slice(-6).toUpperCase()}`;

export function useEnrollmentRequests() {
  const queryClient = useQueryClient();
  const {
    processingId,
    selectedRequest,
    openMenuId,
    menuAnchorRect,
    menuRequest,
    statusFilter,
    deletingRequest,
    setProcessingId,
    setSelectedRequest,
    setOpenMenuId,
    setMenuAnchorRect,
    setMenuRequest,
    setStatusFilter,
    setDeletingRequest,
  } = useEnrollmentRequestsStore();

  const openMenu = (request: EnrollmentRequestItem, buttonEl: HTMLButtonElement) => {
    setMenuRequest(request);
    setOpenMenuId(request._id);
    setMenuAnchorRect(buttonEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuAnchorRect(null);
    setMenuRequest(null);
  };

  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  const {
    data: requests = [],
    isLoading: loading,
  } = useQuery({
    queryKey: webQueryKeys.enrollmentRequests(statusFilter),
    queryFn: () => getEnrollmentRequests(statusFilter),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      status: "approved" | "rejected";
      reason?: string;
    }) => reviewEnrollmentRequest(payload.id, payload.status, payload.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: webQueryKeys.enrollmentRequestsRoot(),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEnrollmentRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: webQueryKeys.enrollmentRequestsRoot(),
      });
    },
  });

  const stats = useMemo(() => {
    const pending = requests.filter((item) => item.status === "pending").length;
    const approved = requests.filter(
      (item) => item.status === "approved",
    ).length;
    const rejected = requests.filter(
      (item) => item.status === "rejected",
    ).length;
    return { total: requests.length, pending, approved, rejected };
  }, [requests]);

  const handleApprove = async (request: EnrollmentRequestItem) => {
    const result = await Swal.fire({
      title: "Approve Enrollment Request?",
      text: `Approve submission ${formatSubmissionId(request._id)} and create an official child record?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) return;

    setProcessingId(request._id);
    try {
      const response = await reviewMutation.mutateAsync({
        id: request._id,
        status: "approved",
      });
      await Swal.fire({
        title: "Approved",
        text: response.message,
        icon: "success",
        confirmButtonColor: "#0D9488",
      });

      if (response.parentCredentials?.tempPassword) {
        showParentCredentialsModal({
          email: response.parentCredentials.email,
          password: response.parentCredentials.tempPassword,
        });
      }
    } catch (error: any) {
      showErrorModal(error?.message || "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: EnrollmentRequestItem) => {
    const result = await Swal.fire({
      title: "Reject Enrollment Request?",
      text: `Reject submission ${formatSubmissionId(request._id)}?`,
      icon: "warning",
      input: "text",
      inputLabel: "Reason (optional)",
      inputPlaceholder: "Explain why this request is rejected...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) return;

    setProcessingId(request._id);
    try {
      const reason = typeof result.value === "string" ? result.value : "";
      const response = await reviewMutation.mutateAsync({
        id: request._id,
        status: "rejected",
        reason,
      });
      await Swal.fire({
        title: "Rejected",
        text: response.message,
        icon: "success",
        confirmButtonColor: "#0D9488",
      });
    } catch (error: any) {
      showErrorModal(error?.message || "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = (request: EnrollmentRequestItem) => {
    closeMenu();
    setDeletingRequest(request);
  };

  const confirmDeleteRequest = async (request: EnrollmentRequestItem) => {
    await deleteMutation.mutateAsync(request._id);
    if (selectedRequest?._id === request._id) {
      setSelectedRequest(null);
    }
  };

  return {
    requests,
    loading,
    stats,
    processingId,
    selectedRequest,
    openMenuId,
    menuAnchorRect,
    menuRequest,
    statusFilter,
    deletingRequest,
    setSelectedRequest,
    setStatusFilter,
    setDeletingRequest,
    openMenu,
    closeMenu,
    handleApprove,
    handleReject,
    handleDelete,
    confirmDeleteRequest
  };
}

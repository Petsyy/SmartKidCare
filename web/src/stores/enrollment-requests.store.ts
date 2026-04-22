import { create } from "zustand";
import type {
  EnrollmentRequestItem,
  EnrollmentRequestStatus,
} from "@/api/admin.api";

type EnrollmentRequestsUiState = {
  statusFilter: EnrollmentRequestStatus;
  selectedRequest: EnrollmentRequestItem | null;
  openMenuId: string | null;
  processingId: string | null;
  setStatusFilter: (value: EnrollmentRequestStatus) => void;
  setSelectedRequest: (value: EnrollmentRequestItem | null) => void;
  setOpenMenuId: (value: string | null) => void;
  setProcessingId: (value: string | null) => void;
};

export const useEnrollmentRequestsStore = create<EnrollmentRequestsUiState>(
  (set) => ({
    statusFilter: "pending",
    selectedRequest: null,
    openMenuId: null,
    processingId: null,
    setStatusFilter: (value) => set({ statusFilter: value }),
    setSelectedRequest: (value) => set({ selectedRequest: value }),
    setOpenMenuId: (value) => set({ openMenuId: value }),
    setProcessingId: (value) => set({ processingId: value }),
  }),
);

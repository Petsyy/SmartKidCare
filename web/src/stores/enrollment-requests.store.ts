import { create } from "zustand";
import type {
  EnrollmentRequestItem,
  EnrollmentRequestStatus,
} from "@/api/admin.api";

type EnrollmentRequestsUiState = {
  statusFilter: EnrollmentRequestStatus;
  selectedRequest: EnrollmentRequestItem | null;
  deletingRequest: EnrollmentRequestItem | null;
  openMenuId: string | null;
  menuAnchorRect: DOMRect | null;
  menuRequest: EnrollmentRequestItem | null;
  processingId: string | null;
  setStatusFilter: (value: EnrollmentRequestStatus) => void;
  setSelectedRequest: (value: EnrollmentRequestItem | null) => void;
  setDeletingRequest: (value: EnrollmentRequestItem | null) => void;
  setOpenMenuId: (value: string | null) => void;
  setMenuAnchorRect: (value: DOMRect | null) => void;
  setMenuRequest: (value: EnrollmentRequestItem | null) => void;
  setProcessingId: (value: string | null) => void;
};

export const useEnrollmentRequestsStore = create<EnrollmentRequestsUiState>(
  (set) => ({
    statusFilter: "pending",
    selectedRequest: null,
    deletingRequest: null,
    openMenuId: null,
    menuAnchorRect: null,
    menuRequest: null,
    processingId: null,
    setStatusFilter: (value) => set({ statusFilter: value }),
    setSelectedRequest: (value) => set({ selectedRequest: value }),
    setDeletingRequest: (value) => set({ deletingRequest: value }),
    setOpenMenuId: (value) => set({ openMenuId: value }),
    setMenuAnchorRect: (value) => set({ menuAnchorRect: value }),
    setMenuRequest: (value) => set({ menuRequest: value }),
    setProcessingId: (value) => set({ processingId: value }),
  }),
);

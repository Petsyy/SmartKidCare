import { create } from "zustand";

type SubmittedStatusFilter = "all" | "pending" | "rejected";

type SubmittedRequestsUiState = {
  submittedStatusFilter: SubmittedStatusFilter;
  submittedSearchQuery: string;
  setSubmittedStatusFilter: (value: SubmittedStatusFilter) => void;
  setSubmittedSearchQuery: (value: string) => void;
  resetSubmittedRequestsUi: () => void;
};

export const useSubmittedRequestsUiStore = create<SubmittedRequestsUiState>((set) => ({
  submittedStatusFilter: "all",
  submittedSearchQuery: "",
  setSubmittedStatusFilter: (value) => set({ submittedStatusFilter: value }),
  setSubmittedSearchQuery: (value) => set({ submittedSearchQuery: value }),
  resetSubmittedRequestsUi: () =>
    set({
      submittedStatusFilter: "all",
      submittedSearchQuery: "",
    }),
}));

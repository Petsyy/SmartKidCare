import { create } from "zustand";

type DashboardUiState = {
  selectedChildId: string | null;
  setSelectedChildId: (value: string | null) => void;
};

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  selectedChildId: null,
  setSelectedChildId: (value) => set({ selectedChildId: value }),
}));

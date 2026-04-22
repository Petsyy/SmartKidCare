import { create } from "zustand";

type ParentChildrenUiState = {
  selectedChildId: string | null;
  setSelectedChildId: (childId: string | null) => void;
};

export const useParentChildrenStore = create<ParentChildrenUiState>((set) => ({
  selectedChildId: null,
  setSelectedChildId: (childId) => set({ selectedChildId: childId }),
}));

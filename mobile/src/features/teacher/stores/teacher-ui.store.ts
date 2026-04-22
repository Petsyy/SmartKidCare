import { create } from "zustand";

type TeacherUiState = {
  attendanceSearchQuery: string;
  feedingSearchQuery: string;
  childrenSearchQuery: string;
  setAttendanceSearchQuery: (value: string) => void;
  setFeedingSearchQuery: (value: string) => void;
  setChildrenSearchQuery: (value: string) => void;
  resetTeacherUi: () => void;
};

export const useTeacherUiStore = create<TeacherUiState>((set) => ({
  attendanceSearchQuery: "",
  feedingSearchQuery: "",
  childrenSearchQuery: "",
  setAttendanceSearchQuery: (value) => set({ attendanceSearchQuery: value }),
  setFeedingSearchQuery: (value) => set({ feedingSearchQuery: value }),
  setChildrenSearchQuery: (value) => set({ childrenSearchQuery: value }),
  resetTeacherUi: () =>
    set({
      attendanceSearchQuery: "",
      feedingSearchQuery: "",
      childrenSearchQuery: "",
    }),
}));

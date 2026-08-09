import { create } from "zustand";
import type { User } from "@/api/authentication.api";

type AccountStatusFilter = "all" | "active" | "inactive";

type UserManagementUiState = {
  activeTab: "teacher" | "parent";
  showAddTeacherModal: boolean;
  editingUser: User | null;
  deletingUser: User | null;
  openMenuUserId: string | null;
  menuAnchorRect: DOMRect | null;
  menuUser: User | null;
  teacherSearchQuery: string;
  parentSearchQuery: string;
  teacherStatusFilter: AccountStatusFilter;
  parentStatusFilter: AccountStatusFilter;
  teacherCenterFilter: string;
  teacherPage: number;
  parentPage: number;
  teacherPageSize: number;
  parentPageSize: number;
  viewingUser: User | null;
  setActiveTab: (value: "teacher" | "parent") => void;
  setShowAddTeacherModal: (value: boolean) => void;
  setEditingUser: (value: User | null) => void;
  setDeletingUser: (value: User | null) => void;
  setOpenMenuUserId: (value: string | null) => void;
  setMenuAnchorRect: (value: DOMRect | null) => void;
  setMenuUser: (value: User | null) => void;
  setTeacherSearchQuery: (value: string) => void;
  setParentSearchQuery: (value: string) => void;
  setTeacherStatusFilter: (value: AccountStatusFilter) => void;
  setParentStatusFilter: (value: AccountStatusFilter) => void;
  setTeacherCenterFilter: (value: string) => void;
  setTeacherPage: (value: number) => void;
  setParentPage: (value: number) => void;
  setTeacherPageSize: (value: number) => void;
  setParentPageSize: (value: number) => void;
  setViewingUser: (value: User | null) => void;
};

export const useUserManagementStore = create<UserManagementUiState>((set) => ({
  activeTab: "teacher",
  showAddTeacherModal: false,
  editingUser: null,
  deletingUser: null,
  openMenuUserId: null,
  menuAnchorRect: null,
  menuUser: null,
  teacherSearchQuery: "",
  parentSearchQuery: "",
  teacherStatusFilter: "all",
  parentStatusFilter: "all",
  teacherCenterFilter: "all",
  teacherPage: 1,
  parentPage: 1,
  teacherPageSize: 10,
  parentPageSize: 10,
  viewingUser: null,
  setActiveTab: (value) => set({ activeTab: value }),
  setShowAddTeacherModal: (value) => set({ showAddTeacherModal: value }),
  setEditingUser: (value) => set({ editingUser: value }),
  setDeletingUser: (value) => set({ deletingUser: value }),
  setOpenMenuUserId: (value) => set({ openMenuUserId: value }),
  setMenuAnchorRect: (value) => set({ menuAnchorRect: value }),
  setMenuUser: (value) => set({ menuUser: value }),
  setTeacherSearchQuery: (value) => set({ teacherSearchQuery: value }),
  setParentSearchQuery: (value) => set({ parentSearchQuery: value }),
  setTeacherStatusFilter: (value) => set({ teacherStatusFilter: value }),
  setParentStatusFilter: (value) => set({ parentStatusFilter: value }),
  setTeacherCenterFilter: (value) => set({ teacherCenterFilter: value }),
  setTeacherPage: (value) => set({ teacherPage: value }),
  setParentPage: (value) => set({ parentPage: value }),
  setTeacherPageSize: (value) => set({ teacherPageSize: value }),
  setParentPageSize: (value) => set({ parentPageSize: value }),
  setViewingUser: (value) => set({ viewingUser: value }),
}));

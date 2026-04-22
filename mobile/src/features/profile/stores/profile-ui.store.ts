import { create } from "zustand";

type ProfileUiState = {
  showPasswordModal: boolean;
  showHelpModal: boolean;
  setShowPasswordModal: (value: boolean) => void;
  setShowHelpModal: (value: boolean) => void;
  resetProfileUi: () => void;
};

export const useProfileUiStore = create<ProfileUiState>((set) => ({
  showPasswordModal: false,
  showHelpModal: false,
  setShowPasswordModal: (value) => set({ showPasswordModal: value }),
  setShowHelpModal: (value) => set({ showHelpModal: value }),
  resetProfileUi: () =>
    set({
      showPasswordModal: false,
      showHelpModal: false,
    }),
}));

import { create } from "zustand";

type AdminLoginState = {
  username: string;
  password: string;
  otp: string;
  mfaToken: string | null;
  mfaEmail: string | null;
  info: string | null;
  error: string | null;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setOtp: (value: string) => void;
  setMfaToken: (value: string | null) => void;
  setMfaEmail: (value: string | null) => void;
  setInfo: (value: string | null) => void;
  setError: (value: string | null) => void;
  resetMessages: () => void;
};

export const useAdminLoginStore = create<AdminLoginState>((set) => ({
  username: "",
  password: "",
  otp: "",
  mfaToken: null,
  mfaEmail: null,
  info: null,
  error: null,
  setUsername: (value) => set({ username: value }),
  setPassword: (value) => set({ password: value }),
  setOtp: (value) => set({ otp: value }),
  setMfaToken: (value) => set({ mfaToken: value }),
  setMfaEmail: (value) => set({ mfaEmail: value }),
  setInfo: (value) => set({ info: value }),
  setError: (value) => set({ error: value }),
  resetMessages: () => set({ info: null, error: null }),
}));

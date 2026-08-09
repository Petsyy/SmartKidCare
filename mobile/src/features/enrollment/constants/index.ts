import type { ProgramType, Step } from "@/src/features/enrollment/types";

export const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Health & Center" },
  { id: 3, label: "Parent Info" },
  { id: 4, label: "Documents" },
  { id: 5, label: "Review" },
];

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

export const PROGRAM_TYPES: ProgramType[] = [
  "4Ps Beneficiary",
  "Regular Enrollee (Non-beneficiary)",
];

export const ENROLL_COLORS = {
  primary: "#0D9488",
  primaryBg: "#F0FDFA",
  primaryBorder: "#99F6E4",

  pending: "#D97706",
  pendingBg: "#FFFBEB",
  pendingBorder: "#FDE68A",
  pendingText: "#B45309",

  rejected: "#DC2626",
  rejectedBg: "#FFF1F2",
  rejectedBorder: "#FECDD3",
  rejectedText: "#B91C1C",

  neutralText: "#374151",
  neutralBorder: "#D1D5DB",
  white: "#FFFFFF",
};

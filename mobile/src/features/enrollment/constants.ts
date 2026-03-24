import type { ProgramType, Step } from "@/src/features/enrollment/types";

export const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Child Info" },
  { id: 2, label: "Parent Info" },
  { id: 3, label: "Documents" },
  { id: 4, label: "Review" },
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

import * as DocumentPicker from "expo-document-picker";
import type { TeacherEnrollmentRequest } from "@/src/api/teacher.api";
import {
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_SIZE,
} from "@/src/features/enrollment/constants";
import type { EnrollmentStatusColors } from "@/src/features/enrollment/types";

export const formatYmd = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addYears = (value: Date, years: number) => {
  const next = new Date(value);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

export const parseYmd = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

export const displayDate = (value: string) => {
  const parsed = parseYmd(value);
  if (!parsed) return "dd/mm/yyyy";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

export const toIsoUtc = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toISOString();

export const inferMimeType = (name: string): string | null => {
  const lower = String(name || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  return null;
};

export const validateDocument = (
  file: DocumentPicker.DocumentPickerAsset | null,
): string | null => {
  if (!file) return "File is required.";
  const mimeType = file.mimeType || inferMimeType(file.name || "");
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return "Only PDF, JPG, and PNG files are allowed.";
  }
  if (typeof file.size === "number" && file.size > MAX_DOCUMENT_SIZE) {
    return "File size must be 5MB or below.";
  }
  return null;
};

export const computeSchoolYear = (value: string) => {
  const parsed = parseYmd(value);
  if (!parsed) return "";
  const year = parsed.getFullYear();
  return `${year}-${year + 1}`;
};

export const formatRequestDate = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
};

export const buildRequestChildName = (request: TeacherEnrollmentRequest) =>
  (
    request.child.fullName ||
    [request.child.firstName, request.child.middleName, request.child.lastName]
      .filter((v) => String(v || "").trim().length > 0)
      .join(" ")
  ).trim();

export const getStatusColors = (
  status: TeacherEnrollmentRequest["status"],
): EnrollmentStatusColors => {
  if (status === "approved") {
    return {
      badgeBackgroundColor: "#DCFCE7",
      textColor: "#047857",
      label: "Approved",
    };
  }
  if (status === "rejected") {
    return {
      badgeBackgroundColor: "#FEE2E2",
      textColor: "#B91C1C",
      label: "Rejected",
    };
  }
  return {
    badgeBackgroundColor: "#FEF3C7",
    textColor: "#B45309",
    label: "Pending",
  };
};

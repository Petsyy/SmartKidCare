import type { UploadResult } from "../../../shared/utils/upload-cloudinary";

export const CHILD_PROGRAM_TYPES = [
  "4Ps Beneficiary",
  "Regular Enrollee (Non-beneficiary)",
] as const;

export const CHILD_GENDERS = ["male", "female"] as const;

export type ChildProgramType = (typeof CHILD_PROGRAM_TYPES)[number];
export type ChildGender = (typeof CHILD_GENDERS)[number];

export type UploadedChildDocument = {
  publicId?: string;
  resourceType?: string;
  format?: string;
  hash?: string;
};

export const normalizeString = (value: unknown): string =>
  String(value ?? "").trim();

export const normalizeOptionalString = (
  value: unknown,
): string | undefined => {
  const normalized = normalizeString(value);
  return normalized ? normalized : undefined;
};

export const normalizeEmail = (value: unknown): string | undefined => {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toLowerCase() : undefined;
};

export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseDate = (value: unknown): Date | null => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const computeAgeFromDate = (value: Date): number => {
  const phTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
  });
  const now = new Date(phTime);

  let age = now.getFullYear() - value.getFullYear();
  const monthDiff = now.getMonth() - value.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < value.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
};

export const splitChildName = (
  rawFullName: string,
):
  | {
      fullName: string;
      firstName: string;
      middleName?: string;
      lastName: string;
    }
  | null => {
  const tokens = rawFullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (tokens.length < 2) return null;

  const firstName = tokens[0];
  const lastName = tokens[tokens.length - 1];
  const middleName =
    tokens.length > 2 ? tokens.slice(1, tokens.length - 1).join(" ") : undefined;

  return {
    fullName: tokens.join(" "),
    firstName,
    middleName,
    lastName,
  };
};

export const buildFullName = (parts: Array<string | undefined>): string =>
  parts.filter((value) => String(value || "").trim().length > 0).join(" ");

export const isChildProgramType = (
  value: string | undefined,
): value is ChildProgramType =>
  Boolean(value) &&
  (CHILD_PROGRAM_TYPES as readonly string[]).includes(String(value));

export const isChildGender = (
  value: string | undefined,
): value is ChildGender =>
  Boolean(value) &&
  (CHILD_GENDERS as readonly string[]).includes(String(value));

export const extractUploadedDocument = (
  upload: UploadResult | null,
  hash: string | null,
): UploadedChildDocument | undefined => {
  if (!upload && !hash) {
    return undefined;
  }

  return {
    publicId: upload?.publicId,
    resourceType: upload?.resourceType,
    format: upload?.format,
    hash: hash || undefined,
  };
};

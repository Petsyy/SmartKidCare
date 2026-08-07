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

type NameLike = {
  firstName?: string | null;
  middleName?: string | null;
  middle?: string | null;
  middle_name?: string | null;
  lastName?: string | null;
};

const normalizeNamePart = (value?: string | null) =>
  String(value ?? "").trim().replace(/\s+/g, " ");

export const maskNamePart = (value?: string | null) => {
  const normalized = normalizeNamePart(value);
  if (!normalized) return "";

  const firstLetter = normalized.charAt(0).toUpperCase();
  const maskLength = normalized.length <= 2 ? 1 : normalized.length - 2;
  return `${firstLetter}${"*".repeat(maskLength)}`;
};

export const formatConfidentialName = (name: NameLike) => {
  const middleName = name.middleName ?? name.middle ?? name.middle_name;

  const maskedLastName = maskNamePart(name.lastName);
  const maskedFirstName = maskNamePart(name.firstName);
  const maskedMiddleName = maskNamePart(middleName);

  return [maskedLastName, maskedFirstName, maskedMiddleName]
    .filter(Boolean)
    .join(", ");
};

export const maskCompositeName = (value?: string | null) => {
  const normalized = normalizeNamePart(value);
  if (!normalized) return "";
  if (normalized.includes("*")) return normalized;

  return normalized
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((part) => maskNamePart(part))
    .join(", ");
};

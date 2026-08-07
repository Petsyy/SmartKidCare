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

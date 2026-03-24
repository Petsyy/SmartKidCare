const MANILA_TIME_ZONE = "Asia/Manila";
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type ManilaDateParts = {
  year: number;
  month: number;
  day: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

const toValidDateParts = (
  year: number,
  month: number,
  day: number,
): ManilaDateParts | null => {
  if (!Number.isInteger(year) || year < 1900 || year > 9999) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

export const parseManilaDateKey = (value: string): ManilaDateParts | null => {
  const match = DATE_KEY_PATTERN.exec(String(value || "").trim());
  if (!match) return null;

  return toValidDateParts(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
};

export const isValidManilaDateKey = (value: string): boolean =>
  Boolean(parseManilaDateKey(value));

export const getManilaDateKey = (value: Date = new Date()): string => {
  const shifted = new Date(value.getTime() + MANILA_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
};

export const toManilaDateKey = (value: string | Date): string | null => {
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return getManilaDateKey(parsed);
};

export const getManilaIsoRangeForDateKey = (
  dateKey: string,
): { startIso: string; endIso: string } | null => {
  const parts = parseManilaDateKey(dateKey);
  if (!parts) return null;

  const startMs =
    Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) -
    MANILA_OFFSET_MS;
  const endMs = startMs + DAY_MS - 1;

  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
};

export const formatManilaDateLabel = (value: string | Date = new Date()) => {
  const dateValue =
    typeof value === "string"
      ? (() => {
          const dayRange = getManilaIsoRangeForDateKey(value);
          if (dayRange) return new Date(dayRange.startIso);

          const fallback = new Date(value);
          return Number.isNaN(fallback.getTime()) ? null : fallback;
        })()
      : value;

  if (!dateValue) return "";

  return dateValue.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: MANILA_TIME_ZONE,
  });
};

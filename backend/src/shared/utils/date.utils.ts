import { normalizeString } from "./string.utils";

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

export type DateRange = {
  start: Date;
  end: Date;
};

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;
const WEEK_MS = WEEK_DAYS * DAY_MS;

export function toLocalDayUtcRange(date: Date, offsetMinutes: number): DateRange {
  const shiftedMs = date.getTime() + offsetMinutes * MINUTE_MS;
  const shiftedDate = new Date(shiftedMs);
  const localStartShifted = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    shiftedDate.getUTCDate(),
    0,
    0,
    0,
    0,
  );

  const start = new Date(localStartShifted - offsetMinutes * MINUTE_MS);
  const end = new Date(start.getTime() + DAY_MS - 1);
  return { start, end };
}

export function toLocalDateKey(date: Date, offsetMinutes: number): string {
  const shiftedMs = date.getTime() + offsetMinutes * MINUTE_MS;
  const shiftedDate = new Date(shiftedMs);
  return shiftedDate.toISOString().slice(0, 10);
}

export function getCurrentWeekStart(todayStart: Date, offsetMinutes: number): Date {
  const start = new Date(todayStart);
  const localWeekAnchor = new Date(start.getTime() + offsetMinutes * MINUTE_MS);
  const dayOfWeek = localWeekAnchor.getUTCDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysFromMonday);
  return start;
}

export function buildWeekRange(weekStart: Date): DateRange {
  return {
    start: weekStart,
    end: new Date(weekStart.getTime() + WEEK_MS - 1),
  };
}

export function getCurrentMonthRange(todayStart: Date, offsetMinutes: number): DateRange {
  const shiftedMs = todayStart.getTime() + offsetMinutes * MINUTE_MS;
  const shiftedDate = new Date(shiftedMs);

  const localMonthStartShifted = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const nextMonthStartShifted = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth() + 1,
    1,
    0,
    0,
    0,
    0,
  );

  const start = new Date(localMonthStartShifted - offsetMinutes * MINUTE_MS);
  const end = new Date(nextMonthStartShifted - offsetMinutes * MINUTE_MS - 1);
  return { start, end };
}

export function weekStartKeyFromDate(date: Date, offsetMinutes: number): string {
  const shiftedMs = date.getTime() + offsetMinutes * MINUTE_MS;
  const shiftedDate = new Date(shiftedMs);
  const dayOfWeek = shiftedDate.getUTCDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;

  const mondayShifted = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    shiftedDate.getUTCDate() - daysFromMonday,
    0,
    0,
    0,
    0,
  );

  const mondayUtc = new Date(mondayShifted - offsetMinutes * MINUTE_MS);
  return toLocalDateKey(mondayUtc, offsetMinutes);
}

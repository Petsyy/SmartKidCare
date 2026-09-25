import type { Request } from "express";
import {
  buildWeekRange,
  getCurrentMonthRange,
  getCurrentWeekStart,
  toLocalDayUtcRange,
} from "./date.utils";

const MANILA_OFFSET_MINUTES = 8 * 60;

export const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
};

export const shouldPaginate = (query: Request["query"]): boolean =>
  query.page !== undefined || query.limit !== undefined;

export const formatChildName = (child?: any): string => {
  if (!child || typeof child !== "object") return "Unknown";
  const middleName = child.middleName ?? child.middle ?? child.middle_name;
  const trailing = [child.firstName, middleName].filter(Boolean).join(" ");
  return trailing ? `${child.lastName}, ${trailing}` : String(child.lastName);
};

export const getDateRangeFromPreset = (
  preset: string,
  now = new Date(),
): { start: Date; end: Date } | null => {
  const today = toLocalDayUtcRange(now, MANILA_OFFSET_MINUTES);

  if (preset === "today") {
    return today;
  }

  if (preset === "thisWeek") {
    return buildWeekRange(
      getCurrentWeekStart(today.start, MANILA_OFFSET_MINUTES),
    );
  }

  if (preset === "thisMonth") {
    return getCurrentMonthRange(today.start, MANILA_OFFSET_MINUTES);
  }

  return null;
};

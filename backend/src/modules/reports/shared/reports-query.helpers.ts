import { toLocalDateKey } from "../../../shared/utils/date.utils";
import type { AdminReportRange } from "../types/reports.types";

const MANILA_OFFSET_MINUTES = 8 * 60;
const DAY_MS = 86_400_000;
const DEFAULT_STUDENT_PAGE = 1;
const DEFAULT_STUDENT_LIMIT = 10;

export const parseManilaDateKeyStart = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day) - MANILA_OFFSET_MINUTES * 60_000,
  );
};

export const getRangeDateMatch = (
  range: AdminReportRange,
  field: string,
): Record<string, unknown> => {
  if (range.startDate && range.endDate) {
    const start = parseManilaDateKeyStart(range.startDate);
    const endStart = parseManilaDateKeyStart(range.endDate);
    return {
      [field]: {
        $gte: start,
        $lte: new Date(endStart.getTime() + DAY_MS - 1),
      },
    };
  }

  if (!range.datePreset || range.datePreset === "all") return {};

  const days = range.datePreset === "7d" ? 7 : range.datePreset === "90d" ? 90 : 30;
  const todayKey = toLocalDateKey(new Date(), MANILA_OFFSET_MINUTES);
  const todayStart = parseManilaDateKeyStart(todayKey);

  return {
    [field]: {
      $gte: new Date(todayStart.getTime() - (days - 1) * DAY_MS),
      $lte: new Date(todayStart.getTime() + DAY_MS - 1),
    },
  };
};

export const getAdminDateMatch = (range: AdminReportRange): Record<string, unknown> =>
  getRangeDateMatch(range, "date");

export const getChildEnrollmentDateMatch = (
  range: AdminReportRange,
): Record<string, unknown> => getRangeDateMatch(range, "enrollmentDate");

export const normalizePagination = (range: AdminReportRange) => {
  const page = Math.max(DEFAULT_STUDENT_PAGE, Number(range.page) || DEFAULT_STUDENT_PAGE);
  const limit = Math.max(1, Number(range.limit) || DEFAULT_STUDENT_LIMIT);
  return { page, limit };
};

import type { Request } from "express";
import Child from "../../models/Child";

export const resolveChildId = (child: any): string => {
  if (child && typeof child === "object") {
    return String(child._id ?? "");
  }
  return String(child ?? "");
};

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
): { start: Date; end: Date } | null => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (preset === "thisWeek") {
    const day = start.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (preset === "thisMonth") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  return null;
};

export async function getParentChildIds(parentId: string): Promise<string[]> {
  const children = await Child.find({ parent: parentId }).select("_id").lean();
  return children.map((child: any) => String(child._id));
}

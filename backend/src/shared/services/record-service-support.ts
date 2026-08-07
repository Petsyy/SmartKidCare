import {ForbiddenError,UnauthorizedError,ValidationError,
} from "../errors/app-error";

export type RecordAuthUser = { id: string; role: string };
export type RecordDateRange = { start: Date; end: Date };
export type CompositeRecordId = { parentId: string; childId: string };

type DateParts = { year: number; month: number; day: number };

/**
 * Shared policy and normalization behavior for teacher-owned daily records.
 * Persistence and record-specific rules remain in each module.
 */
export class RecordServiceSupport {
  private readonly dayMs = 24 * 60 * 60 * 1000;
  private readonly dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

  constructor(
    private readonly utcOffsetMs = 8 * 60 * 60 * 1000,
    private readonly timeZone = "Asia/Manila",
  ) {}

  parseDayRange(value: unknown): RecordDateRange | null {
    const parts = this.parseDateParts(value);
    if (!parts) return null;

    const startMs =
      Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) -
      this.utcOffsetMs;
    return {
      start: new Date(startMs),
      end: new Date(startMs + this.dayMs - 1),
    };
  }

  resolveChildId(value: unknown): string {
    if (value && typeof value === "object") {
      const objectValue = value as { _id?: unknown };
      if (objectValue._id) return String(objectValue._id).trim();
    }
    return String(value ?? "").trim();
  }

  parseTeacherIdQuery(value: unknown): string {
    if (Array.isArray(value)) return String(value[0] ?? "").trim();
    return String(value ?? "").trim();
  }

  buildSearchDateKeys(value: unknown): string[] {
    if (!value) return [];
    const raw = String(value).trim();
    if (!raw) return [];

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return [raw.toLowerCase()];

    const iso = parsed.toISOString();
    const values = [
      raw,
      iso,
      iso.slice(0, 10),
      parsed.toLocaleDateString("en-PH", {
        timeZone: this.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      parsed.toLocaleDateString("en-PH", {
        timeZone: this.timeZone,
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ];

    return Array.from(new Set(values))
      .map((item) => item.toLowerCase())
      .filter(Boolean);
  }

  assertAuthenticated(user: RecordAuthUser | undefined): RecordAuthUser {
    if (!user?.id) throw new UnauthorizedError();
    return user;
  }

  assertPrivileged(user: RecordAuthUser | undefined): RecordAuthUser {
    if (!user?.id || (user.role !== "admin" && user.role !== "teacher")) {
      throw new ForbiddenError("Forbidden");
    }
    return user;
  }

  canMutateTeacherRecord(user: RecordAuthUser, teacherId: unknown): boolean {
    if (user.role === "admin") return true;
    return user.role === "teacher" && String(teacherId || "") === user.id;
  }

  parseCompositeId(id: unknown): CompositeRecordId {
    const normalized = Array.isArray(id)
      ? String(id[0] ?? "").trim()
      : String(id ?? "").trim();
    const [parentId, childId] = normalized.split("-");
    if (!parentId || !childId) throw new ValidationError("Invalid record id");
    return { parentId, childId };
  }

  private parseDateParts(value: unknown): DateParts | null {
    const raw = String(value ?? "").trim();
    if (!raw) return null;

    const dateOnlyMatch = this.dateKeyPattern.exec(raw);
    if (dateOnlyMatch) {
      return this.toValidDateParts(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]),
        Number(dateOnlyMatch[3]),
      );
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    const shifted = new Date(parsed.getTime() + this.utcOffsetMs);
    return this.toValidDateParts(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth() + 1,
      shifted.getUTCDate(),
    );
  }

  private toValidDateParts(
    year: number,
    month: number,
    day: number,
  ): DateParts | null {
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
  }
}

export const recordServiceSupport = new RecordServiceSupport();

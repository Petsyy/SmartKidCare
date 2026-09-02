import { Types } from "mongoose";
import Attendance from "../../../models/Attendance";
import Feeding from "../../../models/Feeding";
import Child from "../../../models/Child";
import { BaseRepository } from "../../../shared/repositories/base.repository";

export type DateRange = {
  start: Date;
  end: Date;
};

// ─── Attendance ───────────────────────────────────────────────────────────────

export class AIAttendanceRepository extends BaseRepository<any> {
  constructor() {
    super(Attendance);
  }

  /**
   * Fetches attendance rows within a date range with an optional filter.
   * Replaces fetchAttendanceRows() in agent-tools.service.ts.
   */
  async findInRange(
    range: DateRange,
    filter: Record<string, unknown> = {},
  ): Promise<any[]> {
    return this.model
      .find(
        { date: { $gte: range.start, $lte: range.end }, ...filter },
        { date: 1, records: 1 },
      )
      .sort({ date: 1 })
      .lean();
  }
}

// ─── Feeding ──────────────────────────────────────────────────────────────────

export class AIFeedingRepository extends BaseRepository<any> {
  constructor() {
    super(Feeding);
  }

  /**
   * Fetches feeding rows within a date range with an optional filter.
   * Replaces fetchFeedingRows() in agent-tools.service.ts.
   */
  async findInRange(
    range: DateRange,
    filter: Record<string, unknown> = {},
  ): Promise<any[]> {
    return this.model
      .find(
        { date: { $gte: range.start, $lte: range.end }, ...filter },
        { date: 1, foodServed: 1, records: 1 },
      )
      .sort({ date: 1 })
      .lean();
  }
}

// ─── Child ────────────────────────────────────────────────────────────────────

export class AIChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  /**
   * Returns the display name for a child.
   * Replaces fetchChildDisplayName() in agent-tools.service.ts.
   */
  async findDisplayName(
    childId: string,
  ): Promise<{ firstName?: string; lastName?: string } | null> {
    if (!Types.ObjectId.isValid(childId)) return null;
    return this.model
      .findById(childId, { firstName: 1, lastName: 1 })
      .lean<{ firstName?: string; lastName?: string } | null>();
  }

  async belongsToParent(childId: string, parentId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(childId) || !Types.ObjectId.isValid(parentId)) return false;
    return Boolean(await this.model.exists({ _id: childId, parent: parentId }));
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const aiAttendanceRepository = new AIAttendanceRepository();
export const aiFeedingRepository = new AIFeedingRepository();
export const aiChildRepository = new AIChildRepository();

// ─── Convenience exports ─────────────────────────────────────────────────────

export const fetchAttendanceRows = (
  range: DateRange,
  filter: Record<string, unknown> = {},
) => aiAttendanceRepository.findInRange(range, filter);

export const fetchFeedingRows = (
  range: DateRange,
  filter: Record<string, unknown> = {},
) => aiFeedingRepository.findInRange(range, filter);

export const fetchChildDisplayName = async (
  childId: string,
): Promise<string | undefined> => {
  const child = await aiChildRepository.findDisplayName(childId);
  if (!child) return undefined;
  const firstName = String(child.firstName ?? "").trim();
  const lastName = String(child.lastName ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || undefined;
};

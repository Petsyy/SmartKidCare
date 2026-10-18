import Attendance from "../../../models/Attendance";
import AttendanceRevision from "../../../models/AttendanceRevision";
import Child from "../../../models/Child";
import { BaseRepository } from "../../../shared/repositories/base.repository";

export type DateRange = { start: Date; end: Date };

export class ChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  async findAssignedChildIds(
    childIds: string[],
    teacherId: string,
    daycareCenterId?: string | null,
  ): Promise<string[]> {
    const children = await this.model
      .find({
        _id: { $in: childIds },
        teacher: teacherId,
        status: "Active",
        ...(daycareCenterId ? { daycareCenter: daycareCenterId } : {}),
      })
      .select("_id")
      .lean();
    return children.map((c: any) => String(c._id));
  }

  async findAllAssignedChildIds(teacherId: string, daycareCenterId: string) {
    const children = await this.model
      .find({
        teacher: teacherId,
        daycareCenter: daycareCenterId,
        status: "Active",
      })
      .select("_id")
      .lean();
    return children.map((child: any) => String(child._id));
  }

  async findChildIdsByParent(parentId: string): Promise<string[]> {
    const children = await this.model
      .find({ parent: parentId })
      .select("_id")
      .lean();
    return children.map((c: any) => String(c._id));
  }
}

export class AttendanceRepository extends BaseRepository<any> {
  constructor() {
    super(Attendance);
  }

  async findByTeacherAndDay(
    teacherId: string,
    range: DateRange,
    daycareCenterId?: string | null,
  ) {
    return this.model.findOne({
      teacher: teacherId,
      ...(daycareCenterId ? { daycareCenter: daycareCenterId } : {}),
      date: { $gte: range.start, $lte: range.end },
    });
  }

  async findByOperationId(clientOperationId: string) {
    return this.model.findOne({ clientOperationId });
  }

  async findById(attendanceId: string) {
    return this.model.findById(attendanceId);
  }

  async findRevisionByOperationId(teacherId: string, clientOperationId: string) {
    return AttendanceRevision.findOne({ teacher: teacherId, clientOperationId });
  }

  async updateWithRevision(input: {
    attendanceId: string;
    teacherId: string;
    daycareCenterId: string;
    expectedVersion: number;
    clientOperationId: string;
    payloadHash: string;
    records: unknown[];
    changes: unknown[];
  }) {
    const session = await this.model.db.startSession();
    let updated: any = null;
    try {
      await session.withTransaction(async () => {
        const versionCondition =
          input.expectedVersion === 0
            ? { $or: [{ version: 0 }, { version: { $exists: false } }] }
            : { version: input.expectedVersion };
        updated = await this.model.findOneAndUpdate(
          {
            _id: input.attendanceId,
            teacher: input.teacherId,
            daycareCenter: input.daycareCenterId,
            ...versionCondition,
          },
          {
            $set: { records: input.records },
            $inc: { version: 1 },
          },
          { new: true, runValidators: true, session },
        );
        if (!updated) return;
        await AttendanceRevision.create(
          [
            {
              attendance: input.attendanceId,
              teacher: input.teacherId,
              daycareCenter: input.daycareCenterId,
              revision: input.expectedVersion + 1,
              clientOperationId: input.clientOperationId,
              payloadHash: input.payloadHash,
              changes: input.changes,
            },
          ],
          { session },
        );
      });
      return updated;
    } finally {
      await session.endSession();
    }
  }

  async findHistory(query: Record<string, unknown>) {
    return this.model.find(query)
      .populate("teacher", "firstName lastName email phone")
      .populate("records.child", "firstName middleName lastName studentId")
      .sort({ date: -1 })
      .lean();
  }
}

export const childRepository = new ChildRepository();
export const attendanceRepository = new AttendanceRepository();

export const findAssignedChildIds = (ids: string[], teacher: string) => childRepository.findAssignedChildIds(ids, teacher);
export const findChildIdsByParent = (parent: string) => childRepository.findChildIdsByParent(parent);

export const findAttendanceByTeacherAndDay = (teacher: string, range: DateRange, center?: string | null) => attendanceRepository.findByTeacherAndDay(teacher, range, center);
export const createAttendance = (data: any) => attendanceRepository.create({ date: data.date, teacher: data.teacherId, records: data.records });
export const findAttendanceHistory = (query: any) => attendanceRepository.findHistory(query);

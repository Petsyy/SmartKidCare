import Feeding from "../../../models/Feeding";
import Child from "../../../models/Child";
import { BaseRepository } from "../../../shared/repositories/base.repository";

export type DateRange = { start: Date; end: Date };

export class ChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  async findAssignedChildIds(childIds: string[], teacherId: string): Promise<string[]> {
    const children = await this.model
      .find({ _id: { $in: childIds }, teacher: teacherId })
      .select("_id")
      .lean();
    return children.map((c: any) => String(c._id));
  }

  async findChildIdsByParent(parentId: string): Promise<string[]> {
    const children = await this.model
      .find({ parent: parentId })
      .select("_id")
      .lean();
    return children.map((c: any) => String(c._id));
  }
}

export class FeedingRepository extends BaseRepository<any> {
  constructor() {
    super(Feeding);
  }

  async findByTeacherAndDay(teacherId: string, range: DateRange) {
    return this.model.findOne({
      teacher: teacherId,
      date: { $gte: range.start, $lte: range.end },
    });
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
export const feedingRepository = new FeedingRepository();

export const findAssignedChildIds = (ids: string[], teacher: string) => childRepository.findAssignedChildIds(ids, teacher);
export const findChildIdsByParent = (parent: string) => childRepository.findChildIdsByParent(parent);

export const findFeedingByTeacherAndDay = (teacher: string, range: DateRange) => feedingRepository.findByTeacherAndDay(teacher, range);
export const createFeeding = (data: any) => feedingRepository.create({ date: data.date, teacher: data.teacherId, foodServed: data.foodServed, records: data.records });
export const findFeedingById = (id: string) => feedingRepository.findById(id);
export const findFeedingHistory = (query: any) => feedingRepository.findHistory(query);

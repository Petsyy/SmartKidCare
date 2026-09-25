import Child from "../../../models/Child";
import ParentConcern, { type IParentConcern } from "../../../models/ParentConcern";
import type {
  ConcernDocument,
  ConcernRepository,
  ConcernScope,
  ListConcernsInput,
} from "../types/concern.types";

const SAFE_POPULATES = [
  { path: "parent", select: "firstName middleName lastName" },
  { path: "child", select: "firstName middleName lastName studentId" },
  { path: "messages.sender", select: "firstName middleName lastName role" },
  { path: "statusHistory.changedBy", select: "firstName middleName lastName role" },
];

export class MongoConcernRepository implements ConcernRepository {
  async findOwnedChild(childId: string, parentId: string) {
    return Child.findOne({ _id: childId, parent: parentId })
      .select("_id daycareCenter")
      .lean();
  }

  async create(data: Partial<IParentConcern>): Promise<ConcernDocument> {
    return ParentConcern.create(data);
  }

  async findDocumentById(id: string, scope: ConcernScope) {
    return ParentConcern.findOne({ _id: id, ...scope });
  }

  async findDetailById(id: string, scope: ConcernScope) {
    let query = ParentConcern.findOne({ _id: id, ...scope });
    SAFE_POPULATES.forEach((populate) => {
      query = query.populate(populate);
    });
    return query.lean();
  }

  async list(
    scope: ConcernScope,
    filters: Pick<ListConcernsInput, "status" | "category">,
    page: number,
    limit: number,
  ) {
    const query = {
      ...scope,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    };

    const [rows, total] = await Promise.all([
      ParentConcern.find(query)
        .select("parent child category subject status lastActivityAt createdAt updatedAt messages")
        .populate("parent", "firstName middleName lastName")
        .populate("child", "firstName middleName lastName studentId")
        .sort({ lastActivityAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ParentConcern.countDocuments(query),
    ]);

    return { rows, total };
  }

  async save(concern: ConcernDocument) {
    return concern.save();
  }
}

export const concernRepository = new MongoConcernRepository();

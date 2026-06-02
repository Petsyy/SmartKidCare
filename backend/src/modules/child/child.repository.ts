import Child from "../../models/Child";
import User, { IUser } from "../../models/Users";
import { BaseRepository } from "../../shared/repositories/base.repository";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── Child Repository ─────────────────────────────────────────────────────────

export class ChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  /**
   * Checks for an existing child with matching name + DOB.
   * Replaces inline findOne in admin-child-create.service.ts.
   */
  async findDuplicate(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
  ): Promise<any | null> {
    return this.model
      .findOne({ firstName, lastName, dateOfBirth })
      .select("_id")
      .lean();
  }

  /**
   * Case-insensitive name + DOB duplicate check (used in enrollment flows).
   */
  async findDuplicateCaseInsensitive(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
  ): Promise<any | null> {
    return this.model
      .findOne({
        firstName: {
          $regex: `^${escapeRegex(firstName)}$`,
          $options: "i",
        },
        lastName: {
          $regex: `^${escapeRegex(lastName)}$`,
          $options: "i",
        },
        dateOfBirth,
      })
      .select("_id")
      .lean();
  }

  async findByParent(parentId: string): Promise<any[]> {
    return this.model.find({ parent: parentId }).lean();
  }

  async findByTeacher(teacherId: string, filter: Record<string, unknown> = {}): Promise<any[]> {
    return this.model.find({ teacher: teacherId, ...filter }).lean();
  }

  async findWithDocuments(childId: string): Promise<any | null> {
    return this.model
      .findById(childId)
      .populate("parent", "_id")
      .populate("teacher", "_id")
      .select("documents parent teacher")
      .lean();
  }
}

// ─── User sub-queries for child services ─────────────────────────────────────

export class ChildUserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({
      email: {
        $regex: `^${escapeRegex(String(email).trim())}$`,
        $options: "i",
      },
    });
  }

  async findParentByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({
      email: {
        $regex: `^${escapeRegex(String(email).trim())}$`,
        $options: "i",
      },
      role: "parent",
    });
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const childRepository = new ChildRepository();
export const childUserRepository = new ChildUserRepository();

// ─── Convenience exports ─────────────────────────────────────────────────────

export const findChildDuplicate = (
  firstName: string,
  lastName: string,
  dateOfBirth: Date,
) => childRepository.findDuplicate(firstName, lastName, dateOfBirth);

export const findChildDuplicateCaseInsensitive = (
  firstName: string,
  lastName: string,
  dateOfBirth: Date,
) => childRepository.findDuplicateCaseInsensitive(firstName, lastName, dateOfBirth);

export const findUserByEmail = (email: string) =>
  childUserRepository.findByEmail(email);

export const findParentByEmail = (email: string) =>
  childUserRepository.findParentByEmail(email);

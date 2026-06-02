import mongoose from "mongoose";
import User, { IUser } from "../../models/Users";
import Child from "../../models/Child";
import { BaseRepository } from "../../shared/repositories/base.repository";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── User Repository ───────────────────────────────────────────────────────────

export class AuthUserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Find a user by email or username/phone depending on route type.
   * Replaces the inline escapeRegex + $or logic in findUserByIdentifier().
   */
  async findByIdentifier(
    identifier: string,
    isAdminRoute: boolean,
  ): Promise<IUser | null> {
    const normalized = String(identifier).trim();

    if (isAdminRoute) {
      return this.model.findOne({
        role: "admin",
        $or: [
          {
            email: {
              $regex: `^${escapeRegex(normalized)}$`,
              $options: "i",
            },
          },
          { username: normalized },
        ],
      });
    }

    return this.model.findOne({
      role: { $in: ["teacher", "parent"] },
      $or: [
        {
          email: {
            $regex: `^${escapeRegex(normalized)}$`,
            $options: "i",
          },
        },
        { phone: normalized },
      ],
    });
  }

  async findByIdWithPopulate(id: string): Promise<IUser | null> {
    return this.model
      .findById(id)
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive")
      .exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({
      email: {
        $regex: `^${escapeRegex(String(email).trim())}$`,
        $options: "i",
      },
    });
  }

  async findByEmailExcluding(
    email: string,
    excludeId: string,
  ): Promise<IUser | null> {
    return this.model.findOne({
      email: {
        $regex: `^${escapeRegex(String(email).trim())}$`,
        $options: "i",
      },
      _id: { $ne: excludeId },
    });
  }

  async findByUsernameExcluding(
    username: string,
    excludeId: string,
  ): Promise<IUser | null> {
    return this.model.findOne({
      username: String(username).trim(),
      _id: { $ne: excludeId },
    });
  }

  async findAllByRole(
    role?: string,
  ): Promise<IUser[]> {
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    return this.model
      .find(filter)
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findEnrolledParentIds(): Promise<unknown[]> {
    return Child.distinct("parent", { parent: { $ne: null } });
  }

  async findParentsByIds(
    parentIds: unknown[],
  ): Promise<IUser[]> {
    return this.model
      .find({
        role: "parent",
        _id: { $in: parentIds as mongoose.Types.ObjectId[] },
      })
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive")
      .sort({ createdAt: -1 })
      .lean();
  }
}

// ─── Child sub-queries used in session.service ────────────────────────────────

export class AuthChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  async findByParentIds(parentIds: unknown[]): Promise<any[]> {
    return this.model
      .find({ parent: { $in: parentIds } })
      .select("_id firstName middleName lastName studentId parent")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findEnrolledParentIds(): Promise<unknown[]> {
    return this.model.distinct("parent", { parent: { $ne: null } });
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const authUserRepository = new AuthUserRepository();
export const authChildRepository = new AuthChildRepository();

// ─── Convenience exports ─────────────────────────────────────────────────────

export const findUserByIdentifier = (identifier: string, isAdminRoute: boolean) =>
  authUserRepository.findByIdentifier(identifier, isAdminRoute);

export const findUserByIdWithPopulate = (id: string) =>
  authUserRepository.findByIdWithPopulate(id);

export const findUserByEmail = (email: string) =>
  authUserRepository.findByEmail(email);

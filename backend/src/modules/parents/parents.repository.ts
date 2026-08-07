import User, { IUser } from "../../models/Users";
import { BaseRepository } from "../../shared/repositories/base.repository";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class ParentRepository extends BaseRepository<IUser> {
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

export const parentRepository = new ParentRepository();

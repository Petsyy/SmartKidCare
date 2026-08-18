import User, { IUser } from "../../models/Users";
import { BaseRepository } from "../../shared/repositories/base.repository";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const phoneRegex = (value: string) => {
  const digits = String(value).replace(/\D/g, "");
  return `^\\D*${digits.split("").map(escapeRegex).join("\\D*")}\\D*$`;
};

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

  async findNonParentByPhone(phone: string): Promise<IUser | null> {
    return this.model.findOne({
      phone: String(phone).trim(),
      role: { $ne: "parent" },
    });
  }

  async findParentByIdentity(
    firstName: string,
    lastName: string,
    phone: string,
  ): Promise<IUser | null> {
    return this.model.findOne({
      role: "parent",
      phone: { $regex: phoneRegex(phone) },
      firstName: { $regex: `^${escapeRegex(String(firstName).trim())}$`, $options: "i" },
      lastName: { $regex: `^${escapeRegex(String(lastName).trim())}$`, $options: "i" },
    });
  }
}

export const parentRepository = new ParentRepository();

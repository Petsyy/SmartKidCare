import bcrypt from "bcryptjs";
import { IUser } from "../../../models/Users";
import { generateTempPassword } from "../../../shared/utils/generate-temp-password";
import { parentRepository } from "../parents.repository";
import type { ParentAccountInput } from "../types/parents.types";

export class ParentService {
  public async findParentByEmail(email: string): Promise<IUser | null> {
    return parentRepository.findParentByEmail(email);
  }

  public async findUserByEmail(email: string): Promise<IUser | null> {
    return parentRepository.findByEmail(email);
  }

  public async createParentAccount(
    input: ParentAccountInput,
  ): Promise<{ parent: IUser; tempPassword: string }> {
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const parent = await parentRepository.create({
      firstName: input.firstName,
      middleName: input.middleName || "",
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: hashedPassword,
      role: "parent",
      mustChangePassword: true,
      needsToConfirmLink: true,
      latestTempPassword: tempPassword,
      latestTempPasswordIssuedAt: new Date(),
    } as any);

    return { parent, tempPassword };
  }

}

export const parentService = new ParentService();

export type { ParentAccountInput } from "../types/parents.types";

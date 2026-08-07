import bcrypt from "bcryptjs";
import { IUser } from "../../../models/Users";
import { generateTempPassword } from "../../../shared/utils/generate-temp-password";
import { parentRepository } from "../parents.repository";
import type { ParentAccountInput, ParentCredentials } from "../types/parents.types";

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

  public async resetParentPassword(parent: IUser): Promise<ParentCredentials> {
    const tempPassword = generateTempPassword();
    parent.password = await bcrypt.hash(tempPassword, 10);
    parent.mustChangePassword = true;
    parent.passwordResetOtpHash = undefined;
    parent.passwordResetOtpExpiresAt = undefined;
    parent.passwordResetOtpPurpose = undefined;
    parent.latestTempPassword = tempPassword;
    parent.latestTempPasswordIssuedAt = new Date();
    await parent.save();

    return {
      email: parent.email,
      phone: parent.phone || "",
      tempPassword,
    };
  }

  public getParentCredentials(parent: {
    email?: string;
    phone?: string;
    latestTempPassword?: string;
    mustChangePassword?: boolean;
  }): ParentCredentials {
    const hasActiveTempPassword =
      Boolean(parent.mustChangePassword) &&
      String(parent.latestTempPassword || "").trim().length > 0;

    return {
      email: String(parent.email || ""),
      phone: String(parent.phone || ""),
      tempPassword: hasActiveTempPassword
        ? String(parent.latestTempPassword || "")
        : null,
    };
  }
}

export const parentService = new ParentService();

export type { ParentAccountInput, ParentCredentials } from "../types/parents.types";

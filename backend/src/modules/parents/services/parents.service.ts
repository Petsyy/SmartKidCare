import bcrypt from "bcryptjs";
import { IUser } from "../../../models/Users";
import { generateTempPassword } from "../../../shared/utils/generate-temp-password";
import { parentRepository } from "../parents.repository";
import type { ParentAccountInput } from "../types/parents.types";

const PARENT_LOGIN_DOMAIN = "smartkidcare.local";

const toLoginNamePart = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "") || "parent";

const isDuplicateEmailError = (error: unknown) => {
  const candidate = error as { code?: number; keyPattern?: { email?: number } };
  return candidate?.code === 11000 && Boolean(candidate.keyPattern?.email);
};

export class ParentService {
  public async findParentByEmail(email: string): Promise<IUser | null> {
    return parentRepository.findParentByEmail(email);
  }

  public async findUserByEmail(email: string): Promise<IUser | null> {
    return parentRepository.findByEmail(email);
  }

  public async findNonParentByPhone(phone: string): Promise<IUser | null> {
    return parentRepository.findNonParentByPhone(phone);
  }

  public async findParentByIdentity(
    firstName: string,
    lastName: string,
    phone: string,
  ): Promise<IUser | null> {
    return parentRepository.findParentByIdentity(firstName, lastName, phone);
  }

  public async createParentAccount(
    input: ParentAccountInput,
  ): Promise<{ parent: IUser; tempPassword: string }> {
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const explicitEmail = String(input.email || "").trim().toLowerCase();
    const baseLogin = `${toLoginNamePart(input.firstName)}.${toLoginNamePart(input.lastName)}`;

    for (let suffix = 1; suffix <= 9999; suffix += 1) {
      const email = explicitEmail || `${baseLogin}${suffix === 1 ? "" : `.${suffix}`}@${PARENT_LOGIN_DOMAIN}`;

      if (!explicitEmail && await parentRepository.findByEmail(email)) {
        continue;
      }

      try {
        const parent = await parentRepository.create({
          firstName: input.firstName,
          middleName: input.middleName || "",
          lastName: input.lastName,
          email,
          phone: input.phone,
          password: hashedPassword,
          role: "parent",
          mustChangePassword: true,
          needsToConfirmLink: true,
          latestTempPassword: tempPassword,
          latestTempPasswordIssuedAt: new Date(),
        } as any);

        return { parent, tempPassword };
      } catch (error) {
        if (!explicitEmail && isDuplicateEmailError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Unable to generate a unique parent login email.");
  }

}

export const parentService = new ParentService();

export type { ParentAccountInput } from "../types/parents.types";

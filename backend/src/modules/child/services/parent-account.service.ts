import bcrypt from "bcryptjs";
import User, { IUser } from "../../../models/Users";
import { generateTempPassword } from "../../../shared/utils/generate-temp-password";
import { escapeRegex } from "../shared";

export type ParentAccountInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ParentCredentials = {
  email: string;
  phone: string;
  tempPassword: string | null;
};

export const findParentByEmail = async (
  email: string,
): Promise<IUser | null> =>
  User.findOne({
    email: {
      $regex: `^${escapeRegex(email)}$`,
      $options: "i",
    },
    role: "parent",
  });

export const findUserByEmail = async (
  email: string,
): Promise<IUser | null> =>
  User.findOne({
    email: {
      $regex: `^${escapeRegex(email)}$`,
      $options: "i",
    },
  });

export const createParentAccount = async (
  input: ParentAccountInput,
): Promise<{ parent: IUser; tempPassword: string }> => {
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const parent = await User.create({
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
  });

  return { parent, tempPassword };
};

export const resetParentPassword = async (
  parent: IUser,
): Promise<ParentCredentials> => {
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
};

export const getParentCredentials = (parent: {
  email?: string;
  phone?: string;
  latestTempPassword?: string;
  mustChangePassword?: boolean;
}): ParentCredentials => {
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
};

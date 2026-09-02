import type { AuthenticatedUser } from "../types/auth.types";
import { ForbiddenError, NotFoundError } from "../errors/app-error";

type ChildAccessRecord = {
  _id?: unknown;
  teacher?: unknown;
  parent?: unknown;
  daycareCenter?: unknown;
};

const asId = (value: unknown): string => {
  if (value && typeof value === "object") {
    const objectValue = value as { _id?: unknown };
    if (objectValue._id !== undefined) return String(objectValue._id);
  }
  return String(value ?? "");
};

export const buildChildAccessFilter = (
  user: AuthenticatedUser,
): Record<string, unknown> => {
  if (user.role === "admin") return {};
  if (user.role === "parent") return { parent: user.id };
  if (user.role === "teacher") {
    if (!user.daycareCenterId) {
      throw new ForbiddenError("Teacher has no active center assignment.");
    }
    return {
      teacher: user.id,
      daycareCenter: user.daycareCenterId,
    };
  }
  throw new ForbiddenError();
};

export const canAccessChild = (
  user: AuthenticatedUser | undefined,
  child: ChildAccessRecord | null | undefined,
): boolean => {
  if (!user?.id || !child) return false;
  if (user.role === "admin") return true;
  if (user.role === "parent") return asId(child.parent) === user.id;
  if (user.role === "teacher") {
    return Boolean(
      user.daycareCenterId &&
        asId(child.teacher) === user.id &&
        asId(child.daycareCenter) === user.daycareCenterId,
    );
  }
  return false;
};

export const canAccessChildIdentityDocument = (
  user: AuthenticatedUser | undefined,
  child: ChildAccessRecord | null | undefined,
): boolean =>
  Boolean(
    user?.role === "admin" ||
      (user?.role === "parent" && asId(child?.parent) === user.id),
  );

export const assertCanAccessChild = (
  user: AuthenticatedUser | undefined,
  child: ChildAccessRecord | null | undefined,
  resourceName = "Child",
): void => {
  if (!child || !canAccessChild(user, child)) {
    throw new NotFoundError(resourceName);
  }
};

export const assertTeacherCenter = (
  user: AuthenticatedUser | undefined,
): string => {
  if (!user?.id || user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }
  if (!user.daycareCenterId) {
    throw new ForbiddenError("Teacher has no active center assignment.");
  }
  return user.daycareCenterId;
};

export const childAccessIds = { asId };

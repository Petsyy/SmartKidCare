import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/app-error";
import {
  findAttendanceById,
  findFeedingById,
} from "./records.repository";

// ─── Types ──────────────────────────────────────────────────────────

type AuthUser = { id: string; role: string };

// ─── Helpers ────────────────────────────────────────────────────────

const assertPrivileged = (user: AuthUser | undefined): AuthUser => {
  if (!user?.id) {
    throw new ForbiddenError("Forbidden");
  }
  if (user.role !== "admin" && user.role !== "teacher") {
    throw new ForbiddenError("Forbidden");
  }
  return user;
};

const canTeacherMutateRecord = (
  user: AuthUser,
  teacherId: unknown,
): boolean => {
  if (user.role === "admin") return true;
  if (user.role !== "teacher") return false;
  return String(teacherId || "") === user.id;
};

const parseCompositeId = (
  id: unknown,
): { parentId: string; childId: string } => {
  const normalized = Array.isArray(id)
    ? String(id[0] ?? "").trim()
    : String(id ?? "").trim();
  const [parentId, childId] = normalized.split("-");
  if (!parentId || !childId) {
    throw new ValidationError("Invalid record id");
  }
  return { parentId, childId };
};

// ─── Attendance mutations ───────────────────────────────────────────

export const updateAttendanceRecord = async (
  user: AuthUser | undefined,
  id: unknown,
  body: Record<string, unknown>,
): Promise<{ message: string }> => {
  const rawStatus = String(body.status || "").trim();
  if (!rawStatus || !["present", "absent"].includes(rawStatus)) {
    throw new ValidationError("Invalid status");
  }
  const status = rawStatus as "present" | "absent";

  const validUser = assertPrivileged(user);
  const parsedId = parseCompositeId(id);

  const attendance = await findAttendanceById(parsedId.parentId);
  if (!attendance) {
    throw new NotFoundError("Attendance");
  }

  if (!canTeacherMutateRecord(validUser, attendance.teacher)) {
    throw new ForbiddenError("Forbidden");
  }

  const record = attendance.records.find(
    (row: any) =>
      String(row.child) === parsedId.childId ||
      String(row.child?._id) === parsedId.childId,
  );

  if (!record) {
    throw new NotFoundError("Child record");
  }

  if (record.status !== status) {
    record.status = status;
    attendance.markModified("records");
    await attendance.save();
  }

  return { message: "Attendance record updated" };
};

export const deleteAttendanceRecord = async (
  user: AuthUser | undefined,
  id: unknown,
): Promise<{ message: string }> => {
  const validUser = assertPrivileged(user);
  const parsedId = parseCompositeId(id);

  const attendance = await findAttendanceById(parsedId.parentId);
  if (!attendance) {
    throw new NotFoundError("Attendance");
  }

  if (!canTeacherMutateRecord(validUser, attendance.teacher)) {
    throw new ForbiddenError("Forbidden");
  }

  const initialLength = attendance.records.length;
  attendance.records.pull({ child: parsedId.childId });

  if (attendance.records.length === initialLength) {
    throw new NotFoundError("Child record");
  }

  attendance.markModified("records");
  await attendance.save();

  return { message: "Attendance record deleted" };
};

// ─── Feeding mutations ──────────────────────────────────────────────

export const updateFeedingRecord = async (
  user: AuthUser | undefined,
  id: unknown,
  body: Record<string, unknown>,
): Promise<{ message: string }> => {
  const rawStatus = String(body.status || "").trim();
  if (!rawStatus || !["completed", "missed"].includes(rawStatus)) {
    throw new ValidationError("Invalid status");
  }
  const status = rawStatus as "completed" | "missed";

  const validUser = assertPrivileged(user);
  const parsedId = parseCompositeId(id);

  const feeding = await findFeedingById(parsedId.parentId);
  if (!feeding) {
    throw new NotFoundError("Feeding");
  }

  if (!canTeacherMutateRecord(validUser, feeding.teacher)) {
    throw new ForbiddenError("Forbidden");
  }

  const record = feeding.records.find(
    (row: any) =>
      String(row.child) === parsedId.childId ||
      String(row.child?._id) === parsedId.childId,
  );

  if (!record) {
    throw new NotFoundError("Child record");
  }

  if (record.status !== status) {
    record.status = status;
    feeding.markModified("records");
    await feeding.save();
  }

  return { message: "Feeding record updated" };
};

export const deleteFeedingRecord = async (
  user: AuthUser | undefined,
  id: unknown,
): Promise<{ message: string }> => {
  const validUser = assertPrivileged(user);
  const parsedId = parseCompositeId(id);

  const feeding = await findFeedingById(parsedId.parentId);
  if (!feeding) {
    throw new NotFoundError("Feeding");
  }

  if (!canTeacherMutateRecord(validUser, feeding.teacher)) {
    throw new ForbiddenError("Forbidden");
  }

  const initialLength = feeding.records.length;
  feeding.records.pull({ child: parsedId.childId });

  if (feeding.records.length === initialLength) {
    throw new NotFoundError("Child record");
  }

  feeding.markModified("records");
  await feeding.save();

  return { message: "Feeding record deleted" };
};

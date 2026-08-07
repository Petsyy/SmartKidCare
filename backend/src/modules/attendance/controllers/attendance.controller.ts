import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { ForbiddenError } from "../../../shared/errors/app-error";
import {
  submitAttendance as submitAttendanceSvc,
  getAttendanceHistory as getAttendanceHistorySvc,
  updateAttendanceRecord as updateAttendanceSvc,
  deleteAttendanceRecord as deleteAttendanceSvc,
} from "../services/attendance.service";

export const submitAttendance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }
  const result = await submitAttendanceSvc(
    req.user as { id: string; role: string },
    req.body ?? {},
  );
  const statusCode = result.isUpdate ? 200 : 201;
  const message = result.isUpdate
    ? "Attendance updated successfully"
    : "Attendance submitted successfully";
  res.status(statusCode).json({ message, attendance: result.attendance });
});

export const getAttendanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await getAttendanceHistorySvc(req.user, req.query);
  res.json(result);
});

export const updateAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateAttendanceSvc(req.user, req.params.id, req.body ?? {});
  res.json(result);
});

export const deleteAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteAttendanceSvc(req.user, req.params.id);
  res.json(result);
});

import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler";
import { ForbiddenError } from "../../shared/errors/app-error";
import {
  submitAttendance as submitAttendanceSvc,
  submitFeeding as submitFeedingSvc,
} from "./records-submit.service";

export const submitAttendance = asyncHandler(
  async (req: Request, res: Response) => {
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

    res.status(statusCode).json({
      message,
      attendance: result.attendance,
    });
  },
);

export const submitFeeding = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id || req.user.role !== "teacher") {
      throw new ForbiddenError("Teachers only");
    }

    const result = await submitFeedingSvc(
      req.user as { id: string; role: string },
      req.body ?? {},
    );

    const statusCode = result.isUpdate ? 200 : 201;
    const message = result.isUpdate
      ? "Feeding updated successfully"
      : "Feeding submitted successfully";

    res.status(statusCode).json({
      message,
      feeding: result.feeding,
    });
  },
);

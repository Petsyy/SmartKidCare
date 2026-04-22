import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler";
import {
  updateAttendanceRecord as updateAttendanceSvc,
  updateFeedingRecord as updateFeedingSvc,
  deleteAttendanceRecord as deleteAttendanceSvc,
  deleteFeedingRecord as deleteFeedingSvc,
} from "./records-mutation.service";

export const updateAttendanceRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await updateAttendanceSvc(req.user, req.params.id, req.body ?? {});
    res.json(result);
  },
);

export const updateFeedingRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await updateFeedingSvc(req.user, req.params.id, req.body ?? {});
    res.json(result);
  },
);

export const deleteAttendanceRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await deleteAttendanceSvc(req.user, req.params.id);
    res.json(result);
  },
);

export const deleteFeedingRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await deleteFeedingSvc(req.user, req.params.id);
    res.json(result);
  },
);

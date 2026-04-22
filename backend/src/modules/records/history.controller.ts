import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler";
import {
  getAttendanceHistory as getAttendanceSvc,
  getFeedingHistory as getFeedingSvc,
} from "./records-history.service";

export const getAttendanceHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getAttendanceSvc(req.user, req.query);
    res.json(result);
  },
);

export const getFeedingHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getFeedingSvc(req.user, req.query);
    res.json(result);
  },
);

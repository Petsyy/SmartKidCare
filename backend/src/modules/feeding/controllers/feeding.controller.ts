import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { ForbiddenError } from "../../../shared/errors/app-error";
import {
  submitFeeding as submitFeedingSvc,
  getFeedingHistory as getFeedingHistorySvc,
  updateFeedingRecord as updateFeedingSvc,
  deleteFeedingRecord as deleteFeedingSvc,
} from "../services/feeding.service";

export const submitFeeding = asyncHandler(async (req: Request, res: Response) => {
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
  res.status(statusCode).json({ message, feeding: result.feeding });
});

export const getFeedingHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await getFeedingHistorySvc(req.user, req.query);
  res.json(result);
});

export const updateFeedingRecord = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateFeedingSvc(req.user, req.params.id, req.body ?? {});
  res.json(result);
});

export const deleteFeedingRecord = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteFeedingSvc(req.user, req.params.id);
  res.json(result);
});

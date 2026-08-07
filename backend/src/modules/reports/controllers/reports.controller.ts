import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { reportsService } from "../services/reports.service";

export const getChildReport = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.params;
  const result = await reportsService.getChildReport(childId as string, req.query as Record<string, string>);
  res.json(result);
});

export const getAdminAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportsService.getAdminAnalytics(
    req.query as {
      startDate?: string;
      endDate?: string;
      datePreset?: "7d" | "30d" | "90d" | "all";
      page?: number;
      limit?: number;
    },
  );
  res.json(result);
});

export const getTeacherReport = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.user?.id;
  if (!teacherId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const result = await reportsService.getTeacherReport(teacherId, req.query as Record<string, string>);
  res.json(result);
});

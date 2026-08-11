import { Request, Response } from "express";
import { nutritionService } from "../services/nutrition.service";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { UnauthorizedError } from "../../../shared/errors/app-error";

export const getMyClassNutrition = asyncHandler(
  async (req: Request, res: Response) => {
    const teacherId = req.user?.id;
    if (!teacherId) throw new UnauthorizedError();

    const { schoolYear, period } = req.query as {
      schoolYear: string;
      period: "initial" | "final";
    };

    const data = await nutritionService.getMyClassNutrition(
      teacherId,
      schoolYear,
      period,
    );
    res.json({ success: true, data });
  },
);

export const evaluateNutrition = asyncHandler(
  async (req: Request, res: Response) => {
    const teacherId = req.user?.id;
    if (!teacherId) throw new UnauthorizedError();

    const record = await nutritionService.evaluateNutrition({
      ...req.body,
      teacherId,
    });
    res.json({ success: true, data: record });
  },
);

export const getChildNutritionHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await nutritionService.getChildNutritionHistory(
      req.params.id as string,
    );
    res.json({ success: true, data });
  },
);

export const getNutritionAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolYear } = req.query as { schoolYear: string };
    if (!schoolYear) {
      return res
        .status(400)
        .json({ success: false, message: "schoolYear is required" });
    }

    const data = await nutritionService.getNutritionAnalytics(schoolYear);
    res.json({ success: true, data });
  },
);

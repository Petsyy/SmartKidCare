import { Request, Response } from "express";
import { nutritionService } from "../services/nutrition.service";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { UnauthorizedError } from "../../../shared/errors/app-error";

export const getMyClassNutrition = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) throw new UnauthorizedError();

    const { schoolYear, period } = req.query as {
      schoolYear: string;
      period: "initial" | "final";
    };

    const data = await nutritionService.getMyClassNutrition(
      req.user,
      schoolYear,
      period,
    );
    res.json({ success: true, data });
  },
);

export const evaluateNutrition = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) throw new UnauthorizedError();

    const record = await nutritionService.evaluateNutrition(req.user, req.body);
    res.json({ success: true, data: record });
  },
);

export const getChildNutritionHistory = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) throw new UnauthorizedError();
    const data = await nutritionService.getChildNutritionHistory(
      req.user,
      req.params.id as string,
    );
    res.json({ success: true, data });
  },
);

export const getNutritionAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolYear, centerId } = req.query as {
      schoolYear?: string;
      centerId?: string;
    };

    const data = await nutritionService.getNutritionAnalytics(schoolYear, centerId);
    res.json({ success: true, data });
  },
);

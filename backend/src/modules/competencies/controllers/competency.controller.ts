import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { competencyService } from "../services/competency.service";

export const listDefinitions = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(await competencyService.getDefinitions(req.user));
  },
);

export const createEvaluation = asyncHandler(
  async (req: Request, res: Response) => {
    const evaluation = await competencyService.saveEvaluation(
      req.user,
      req.body,
    );
    res
      .status(201)
      .json({
        message:
          req.body.status === "draft"
            ? "Draft saved."
            : "Evaluation submitted.",
        evaluation,
      });
  },
);

export const evaluationByPeriod = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await competencyService.getEvaluationByPeriod(
        req.user,
        req.params.childId as string,
        req.params.period as string,
      ),
    );
  },
);

export const competencyAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await competencyService.getAnalytics(
        req.user,
        req.query as { period?: string; schoolYear?: string },
      ),
    );
  },
);

export const evaluationHistory = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await competencyService.getEvaluationHistory(
        req.user,
        req.params.childId as string,
        Number(req.query.page),
        Number(req.query.limit),
      ),
    );
  },
);

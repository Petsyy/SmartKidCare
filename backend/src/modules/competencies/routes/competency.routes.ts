import express from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import {
  createEvaluation,
  evaluationHistory,
  evaluationByPeriod,
  listDefinitions,
  competencyAnalytics,
} from "../controllers/competency.controller";
import {
  validateChildParams,
  validateChildAndPeriodParams,
  validateEvaluation,
  validateHistoryQuery,
  validateAnalyticsQuery,
} from "../validators/competency.validator";

const router = express.Router();
router.use(authenticateToken);
router.get(
  "/definitions",
  requireRole("barangay_captain", "teacher", "parent"),
  listDefinitions,
);
router.get(
  "/analytics",
  requireRole("barangay_captain"),
  validateAnalyticsQuery,
  competencyAnalytics,
);
router.post(
  "/evaluations",
  requireRole("teacher"),
  validateEvaluation,
  createEvaluation,
);
router.get(
  "/children/:childId/evaluations/:period",
  requireRole("barangay_captain", "teacher", "parent"),
  validateChildAndPeriodParams,
  evaluationByPeriod,
);
router.get(
  "/children/:childId/evaluations",
  requireRole("barangay_captain", "teacher", "parent"),
  validateChildParams,
  validateHistoryQuery,
  validateAnalyticsQuery,
  evaluationHistory,
);

export default router;

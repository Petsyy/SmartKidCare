import express from "express";
import {
  getAdminAnalytics,
  getChildReport,
  getTeacherReport,
} from "../controllers/reports.controller";
import { validateAdminReportQuery, validateReportQuery } from "../validators/reports.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/admin-analytics",
  requireRole("admin"),
  validateAdminReportQuery,
  getAdminAnalytics,
);

// Teacher and Admin can get their aggregated class report
router.get(
  "/teacher",
  requireRole("teacher"),
  validateReportQuery,
  getTeacherReport
);

// Parents, Teachers, and Admins can get a specific child's report
router.get(
  "/child/:childId",
  requireRole("admin", "teacher", "parent"),
  validateReportQuery,
  getChildReport
);

export default router;

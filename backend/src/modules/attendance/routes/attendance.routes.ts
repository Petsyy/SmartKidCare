import express from "express";
import {
  submitAttendance,
  getAttendanceHistory,
} from "../controllers/attendance.controller";
import {
  validateSubmitAttendance,
  validateAttendanceHistoryQuery,
} from "../validators/attendance.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = express.Router();

router.use(authenticateToken);

// Teacher-only Submissions
router.post("/", requireRole("teacher"), validateSubmitAttendance, submitAttendance);

// Multi-role History Queries (Admin, Teacher, Parent)
router.get("/", requireRole("admin", "teacher", "parent"), validateAttendanceHistoryQuery, getAttendanceHistory);

export default router;

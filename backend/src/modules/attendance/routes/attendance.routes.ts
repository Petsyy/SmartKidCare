import express from "express";
import {
  submitAttendance,
  getAttendanceHistory,
  updateAttendance,
} from "../controllers/attendance.controller";
import {
  validateSubmitAttendance,
  validateAttendanceHistoryQuery,
  validateAttendanceIdParams,
  validateUpdateAttendance,
} from "../validators/attendance.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = express.Router();

router.use(authenticateToken);

// Teacher-only Submissions
router.post("/", requireRole("teacher"), validateSubmitAttendance, submitAttendance);
router.patch(
  "/:attendanceId",
  requireRole("teacher"),
  validateAttendanceIdParams,
  validateUpdateAttendance,
  updateAttendance,
);

// Multi-role History Queries (Admin, Teacher, Parent)
router.get("/", requireRole("barangay_captain", "teacher", "parent"), validateAttendanceHistoryQuery, getAttendanceHistory);

export default router;

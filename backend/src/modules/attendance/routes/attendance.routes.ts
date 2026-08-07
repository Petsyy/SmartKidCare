import express from "express";
import {
  submitAttendance,
  getAttendanceHistory,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from "../controllers/attendance.controller";
import {
  validateSubmitAttendance,
  validateUpdateAttendance,
  validateAttendanceHistoryQuery,
} from "../validators/attendance.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = express.Router();

router.use(authenticateToken);

// Teacher-only Submissions
router.post("/", requireRole("teacher"), validateSubmitAttendance, submitAttendance);

// Admin & Teacher Mutations
router.patch("/:id", requireRole("admin", "teacher"), validateUpdateAttendance, updateAttendanceRecord);
router.delete("/:id", requireRole("admin", "teacher"), deleteAttendanceRecord);

// Multi-role History Queries (Admin, Teacher, Parent)
router.get("/", requireRole("admin", "teacher", "parent"), validateAttendanceHistoryQuery, getAttendanceHistory);

export default router;

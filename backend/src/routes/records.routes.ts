import express from "express";
import {
  submitAttendance,
  submitFeeding,
  getAttendanceHistory,
  getFeedingHistory,
} from "../controllers/records.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * Teacher: Submit daily attendance
 */
router.post("/attendance", authenticateToken, submitAttendance);

/**
 * Teacher: Submit daily feeding
 */
router.post("/feeding", authenticateToken, submitFeeding);

/**
 * Teacher/Admin: Get attendance history
 */
router.get("/attendance", authenticateToken, getAttendanceHistory);

/**
 * Teacher/Admin: Get feeding history
 */
router.get("/feeding", authenticateToken, getFeedingHistory);

export default router;

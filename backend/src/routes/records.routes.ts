import express from "express";
import {
  submitAttendance,
  submitFeeding,
  getAttendanceHistory,
  getFeedingHistory,
  updateAttendanceRecord,
  updateFeedingRecord,
  deleteAttendanceRecord,
  deleteFeedingRecord,
} from "../controllers";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.patch("/attendance/:id", authenticateToken, updateAttendanceRecord);
router.patch("/feeding/:id", authenticateToken, updateFeedingRecord);
router.delete("/attendance/:id", authenticateToken, deleteAttendanceRecord);
router.delete("/feeding/:id", authenticateToken, deleteFeedingRecord);
router.post("/attendance", authenticateToken, submitAttendance);
router.post("/feeding", authenticateToken, submitFeeding);
router.get("/attendance", authenticateToken, getAttendanceHistory);
router.get("/feeding", authenticateToken, getFeedingHistory);

export default router;

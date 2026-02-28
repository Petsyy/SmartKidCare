import express from "express";
import {
  submitAttendance,
  submitFeeding,
  getAttendanceHistory,
  getFeedingHistory,
  updateAttendanceRecord,
  updateFeedingRecord,
  deleteAttendanceRecord,
  getAttendanceVerification,
  getFeedingVerification,
  getTxForDateHash,
} from "../controllers";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.patch("/attendance/:id", authenticateToken, updateAttendanceRecord);
router.patch("/feeding/:id", authenticateToken, updateFeedingRecord);
router.delete("/attendance/:id", authenticateToken, deleteAttendanceRecord);
router.post("/attendance", authenticateToken, submitAttendance);
router.post("/feeding", authenticateToken, submitFeeding);
router.get("/attendance", authenticateToken, getAttendanceHistory);
router.get("/attendance/verify/:id", authenticateToken, getAttendanceVerification);
router.get("/attendance/tx/:dateHash", authenticateToken, getTxForDateHash);
router.get("/feeding", authenticateToken, getFeedingHistory);
router.get("/feeding/verify/:id", authenticateToken, getFeedingVerification);

export default router;

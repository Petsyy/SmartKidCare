import express from "express";
import {
  submitFeeding,
  getFeedingHistory,
  updateFeedingRecord,
  deleteFeedingRecord,
} from "../controllers/feeding.controller";
import {
  validateSubmitFeeding,
  validateUpdateFeeding,
  validateFeedingHistoryQuery,
} from "../validators/feeding.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = express.Router();

router.use(authenticateToken);

// Teacher-only Submissions
router.post("/", requireRole("teacher"), validateSubmitFeeding, submitFeeding);

// Admin & Teacher Mutations
router.patch("/:id", requireRole("admin", "teacher"), validateUpdateFeeding, updateFeedingRecord);
router.delete("/:id", requireRole("admin", "teacher"), deleteFeedingRecord);

// Multi-role History Queries (Admin, Teacher, Parent)
router.get("/", requireRole("admin", "teacher", "parent"), validateFeedingHistoryQuery, getFeedingHistory);

export default router;

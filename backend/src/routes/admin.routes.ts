import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  createTeacher,
  resetPassword,
  toggleUserStatus,
  getParentChildren,
  updateUserProfile,
  deleteUser,
  getAuditLogs,
} from "../controllers/admin/admin.controller";

const router = Router();

router.post("/teachers", authenticateToken, createTeacher);

router.post("/users/:id/reset-password", authenticateToken, resetPassword);
router.patch("/users/:id", authenticateToken, updateUserProfile);
router.patch("/users/:id/toggle-status", authenticateToken, toggleUserStatus);
router.delete("/users/:id", authenticateToken, deleteUser);
router.get("/parents/:parentId/children", authenticateToken, getParentChildren);
router.get("/audit-logs", authenticateToken, getAuditLogs);

export default router;

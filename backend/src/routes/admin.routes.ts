import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  createTeacher,
  resetPassword,
  toggleUserStatus,
  getParentChildren,
  updateUserProfile,
  deleteUser,
} from "../controllers/admin.controller";

const router = Router();

router.post("/teachers", authenticateToken, createTeacher);

router.post("/users/:id/reset-password", authenticateToken, resetPassword);
router.patch("/users/:id", authenticateToken, updateUserProfile);
router.patch("/users/:id/toggle-status", authenticateToken, toggleUserStatus);
router.delete("/users/:id", authenticateToken, deleteUser);
router.get("/parents/:parentId/children", authenticateToken, getParentChildren);

export default router;

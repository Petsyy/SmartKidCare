import { Router } from "express";
import {
  login,
  getMe,
  getAllUsers,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Auth
 */
router.post("/login", login);
router.post("/admin/login", login);
router.get("/me", authenticateToken, getMe);

/**
 * Admin-only
 */
router.get("/users", authenticateToken, getAllUsers);

export default router;

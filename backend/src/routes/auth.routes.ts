import { Router } from "express";
import { login, adminLogin, getMe, getAllUsers, updateUserStatus } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/admin/login", adminLogin);

// Protected routes (mobile: send Authorization: Bearer <token>)
router.get("/me", authenticateToken, getMe);

// Admin / user management (can add authenticateToken + role check later)
router.get("/users", getAllUsers);
router.patch("/users/:userId/status", updateUserStatus);

export default router;

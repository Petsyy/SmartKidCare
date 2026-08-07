import { Router } from "express";
import * as SettingsController from "../controllers/settings.controller";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = Router();

// Public endpoint so the app can load branding before login
router.get("/", SettingsController.getSettings);

// Admin only
router.put("/", authenticateToken, requireRole("admin"), SettingsController.updateSettings);

export default router;

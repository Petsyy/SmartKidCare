import { Router } from "express";
import {
  aiChatController,
  invalidateAiContextController,
} from "../controllers/chat.controller";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import { parentAiChatLimiter } from "../../../shared/lib/rate-limit";
import {
  validateAiChat,
  validateAiContextParams,
} from "../validators/ai.validator";

const router = Router();

router.post(
  "/chat",
  authenticateToken,
  requireRole("parent"),
  parentAiChatLimiter,
  validateAiChat,
  aiChatController,
);
router.delete(
  "/chat/contexts/:contextId",
  authenticateToken,
  requireRole("parent"),
  parentAiChatLimiter,
  validateAiContextParams,
  invalidateAiContextController,
);

export default router;

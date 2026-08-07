import { Router } from "express";
import { aiChatController } from "../index";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";

const router = Router();

router.post("/chat", authenticateToken, aiChatController);

export default router;

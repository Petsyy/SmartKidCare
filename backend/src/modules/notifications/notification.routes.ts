import { Router } from "express";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import {
  dispatchTeacherNotifications,
  getParentNotifications,
  getTeacherNotifications,
  registerPushToken,
  sendTestPushNotification,
  unregisterPushToken,
} from "./index";

const router = Router();

router.post("/register-token", authenticateToken, registerPushToken);
router.post("/unregister-token", authenticateToken, unregisterPushToken);
router.post("/send-test", authenticateToken, sendTestPushNotification);
router.post("/teacher-v1/dispatch", authenticateToken, dispatchTeacherNotifications);
router.get("/teacher-v1/feed", authenticateToken, getTeacherNotifications);
router.get("/parent-v1/feed", authenticateToken, getParentNotifications);

export default router;

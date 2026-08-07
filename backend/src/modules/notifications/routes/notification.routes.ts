import { Router } from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import {
  dispatchTeacherNotifications,
  getParentNotifications,
  getTeacherNotifications,
  registerPushToken,
  sendTestPushNotification,
  unregisterPushToken,
} from "../controllers/notification.controller";
import {
  validateDispatchTeacherNotifications,
  validateParentNotificationsFeed,
  validateRegisterPushToken,
  validateSendTestPush,
  validateTeacherNotificationsFeed,
  validateUnregisterPushToken,
} from "../validators/notification.validator";

const router = Router();

router.use(authenticateToken);

// Device Token Registration (Shared)
router.post("/register-token", validateRegisterPushToken, registerPushToken);
router.post(
  "/unregister-token",
  validateUnregisterPushToken,
  unregisterPushToken,
);

// Admin-only Push Testing
router.post(
  "/send-test",
  requireRole("admin"),
  validateSendTestPush,
  sendTestPushNotification,
);

// Teacher Notification Endpoints
router.post(
  "/teacher-v1/dispatch",
  requireRole("teacher", "admin"),
  validateDispatchTeacherNotifications,
  dispatchTeacherNotifications,
);
router.get(
  "/teacher-v1/feed",
  requireRole("teacher", "admin"),
  validateTeacherNotificationsFeed,
  getTeacherNotifications,
);

// Parent Notification Endpoints
router.get(
  "/parent-v1/feed",
  requireRole("parent", "admin"),
  validateParentNotificationsFeed,
  getParentNotifications,
);

export default router;

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
  getAdminNotificationFeed,
  markAllAdminNotificationsRead,
  setAdminNotificationArchived,
  setAdminNotificationRead,
} from "../controllers/admin-notification.controller";
import {
  validateAdminNotificationArchive,
  validateAdminNotificationFeed,
  validateAdminNotificationParams,
  validateAdminNotificationRead,
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

// Barangay Captain in-app notification inbox
router.get(
  "/admin-v1/feed",
  requireRole("barangay_captain"),
  validateAdminNotificationFeed,
  getAdminNotificationFeed,
);
router.patch(
  "/admin-v1/read-all",
  requireRole("barangay_captain"),
  markAllAdminNotificationsRead,
);
router.patch(
  "/admin-v1/:id/read",
  requireRole("barangay_captain"),
  validateAdminNotificationParams,
  validateAdminNotificationRead,
  setAdminNotificationRead,
);
router.patch(
  "/admin-v1/:id/archive",
  requireRole("barangay_captain"),
  validateAdminNotificationParams,
  validateAdminNotificationArchive,
  setAdminNotificationArchived,
);

// Admin-only Push Testing
router.post(
  "/send-test",
  requireRole("barangay_captain"),
  validateSendTestPush,
  sendTestPushNotification,
);

// Teacher Notification Endpoints
router.post(
  "/teacher-v1/dispatch",
  requireRole("teacher"),
  validateDispatchTeacherNotifications,
  dispatchTeacherNotifications,
);
router.get(
  "/teacher-v1/feed",
  requireRole("teacher"),
  validateTeacherNotificationsFeed,
  getTeacherNotifications,
);

// Parent Notification Endpoints
router.get(
  "/parent-v1/feed",
  requireRole("parent"),
  validateParentNotificationsFeed,
  getParentNotifications,
);

export default router;

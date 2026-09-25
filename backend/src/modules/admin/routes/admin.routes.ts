import { Router } from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import {
  createTeacher,
  createCaptain,
  resendCaptainInvitation,
  revokeCaptainInvitation,
  getSystemOverview,
  resetPassword,
  toggleUserStatus,
  updateUserProfile,
  deleteUser,
} from "../controllers/user-management.controller";
import {
  createDaycareCenter,
  getDaycareCenters,
  updateDaycareCenter,
} from "../controllers/daycare-centers.controller";

import {
  validateCreateDaycareCenter,
  validateUpdateDaycareCenter,
  validateGetDaycareCentersQuery,
  validateCreateTeacher,
  validateCreateCaptain,
  validateCaptainIdParams,
  validateUpdateUserProfile,
} from "../validators/admin.validator";

const router = Router();

// All routes in admin module require Admin authentication and role
router.use(authenticateToken, requireRole("system_admin"));

// Teacher Account Creation
router.post("/teachers", validateCreateTeacher, createTeacher);
router.post("/captains", validateCreateCaptain, createCaptain);
router.post("/captains/:id/invitation/resend", validateCaptainIdParams, resendCaptainInvitation);
router.delete("/captains/:id/invitation", validateCaptainIdParams, revokeCaptainInvitation);
router.get("/system-overview", getSystemOverview);

// User Management (Teachers & Parents)
router.post("/users/:id/reset-password", resetPassword);
router.patch("/users/:id", validateUpdateUserProfile, updateUserProfile);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.delete("/users/:id", deleteUser);


export default router;

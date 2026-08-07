import { Router } from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import {
  createTeacher,
  resetPassword,
  toggleUserStatus,
  getParentChildren,
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
  validateUpdateUserProfile,
} from "../validators/admin.validator";

const router = Router();

// All routes in admin module require Admin authentication and role
router.use(authenticateToken, requireRole("admin"));

// Daycare Center Management
router.get("/daycare-centers", validateGetDaycareCentersQuery, getDaycareCenters);
router.post("/daycare-centers", validateCreateDaycareCenter, createDaycareCenter);
router.patch("/daycare-centers/:id", validateUpdateDaycareCenter, updateDaycareCenter);

// Teacher Account Creation
router.post("/teachers", validateCreateTeacher, createTeacher);

// User Management (Teachers & Parents)
router.post("/users/:id/reset-password", resetPassword);
router.patch("/users/:id", validateUpdateUserProfile, updateUserProfile);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/parents/:parentId/children", getParentChildren);


export default router;

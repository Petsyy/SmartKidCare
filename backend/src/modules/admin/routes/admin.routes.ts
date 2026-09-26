import { Router } from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import {
  createTeacher,
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
  validateUpdateUserProfile,
} from "../validators/admin.validator";

const router = Router();

// Administrative operations are owned by the Barangay Captain.
router.use(authenticateToken, requireRole("barangay_captain"));

// Teacher Account Creation
router.post("/teachers", validateCreateTeacher, createTeacher);
router.get("/system-overview", getSystemOverview);

// User Management (Teachers & Parents)
router.post("/users/:id/reset-password", resetPassword);
router.patch("/users/:id", validateUpdateUserProfile, updateUserProfile);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.delete("/users/:id", deleteUser);


export default router;

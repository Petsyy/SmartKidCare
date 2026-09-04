import express from "express";
import {
  getPickupEligibleChildren,
  requestPickupCode,
  verifyPickupCode,
  manualRelease,
  getPickupStatus,
  getPickupHistory,
} from "../controllers/pickup.controller";
import {
  validateRequestCode,
  validateVerifyCode,
  validateManualRelease,
  validatePickupHistoryQuery,
} from "../validators/pickup.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import { validate } from "../../../shared/middleware/validate.middleware";

const router = express.Router();

router.use(authenticateToken);

// Teacher endpoints
router.get("/children", requireRole("teacher"), getPickupEligibleChildren);
router.post("/verify", requireRole("teacher"), validate(validateVerifyCode), verifyPickupCode);
router.post("/manual-release", requireRole("teacher"), validate(validateManualRelease), manualRelease);

// Parent endpoints
router.post("/request-code", requireRole("parent"), validate(validateRequestCode), requestPickupCode);

// Mixed roles
router.get("/status/:childId", requireRole("teacher", "parent"), getPickupStatus);
router.get("/history", requireRole("admin", "teacher", "parent"), validate(validatePickupHistoryQuery, "query"), getPickupHistory);

export default router;

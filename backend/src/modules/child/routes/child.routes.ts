import express from "express";
import {
  getChildren,
  getMyChildren,
  getChildById,
  createChild,
  deleteChild,
  updateChild,
  addGuardianHandler,
  updateGuardianHandler,
  removeGuardianHandler,
  getGuardiansHandler,
} from "../controllers";
import {
  validateCreateChild,
  validateUpdateChild,
  validateGetChildrenQuery,
} from "../validators/child.validator";
import { validateGuardian } from "../../pickup/validators/pickup.validator";
import { requireRole } from "../../../shared/middleware/role.middleware";
import { validate } from "../../../shared/middleware/validate.middleware";

import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import upload from "../../../shared/middleware/upload.middleware";

const router = express.Router();

router.use(authenticateToken);

router.get("/", validateGetChildrenQuery, getChildren);
router.get("/my-children", getMyChildren);

router.get("/:id", getChildById);

router.post(
  "/",
  upload.fields([
    { name: "birthCertificate", maxCount: 1 },
    { name: "parentId", maxCount: 1 },
  ]),
  validateCreateChild,
  createChild,
);

router.patch("/:id", validateUpdateChild, updateChild);
router.delete("/:id", deleteChild);

router.post(
  "/:id/guardians",
  requireRole("teacher", "admin"),
  validate(validateGuardian),
  addGuardianHandler,
);
router.put(
  "/:id/guardians/:guardianIndex",
  requireRole("teacher", "admin"),
  validate(validateGuardian),
  updateGuardianHandler,
);
router.delete(
  "/:id/guardians/:guardianIndex",
  requireRole("teacher", "admin"),
  removeGuardianHandler,
);
router.get(
  "/:id/guardians",
  requireRole("teacher", "admin", "parent"),
  getGuardiansHandler,
);

export default router;

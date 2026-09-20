import express from "express";
import {
  getChildren,
  getMyChildren,
  getChildById,
  getParentCredentials,
  resetParentCredentials,
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

const ensureMultipartBody = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) => {
  req.body = req.body || {};
  next();
};

const router = express.Router();

router.use(authenticateToken);

router.get("/", validateGetChildrenQuery, getChildren);
router.get("/my-children", getMyChildren);

router.get("/:id", getChildById);
router.get("/:id/parent-credentials", requireRole("teacher", "admin"), getParentCredentials);
router.post("/:id/parent-credentials/reset", requireRole("teacher"), resetParentCredentials);

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
  upload.fields([
    { name: "guardianPhoto", maxCount: 1 },
    { name: "guardianId", maxCount: 1 },
  ]),
  ensureMultipartBody,
  validate(validateGuardian),
  addGuardianHandler,
);
router.put(
  "/:id/guardians/:guardianIndex",
  requireRole("teacher", "admin"),
  upload.fields([
    { name: "guardianPhoto", maxCount: 1 },
    { name: "guardianId", maxCount: 1 },
  ]),
  ensureMultipartBody,
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

import express from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import * as controller from "../controllers/offline-sync.controller";
import * as validator from "../validators/offline-sync.validator";

const router = express.Router();
router.use(authenticateToken, requireRole("teacher", "parent"));
router.post("/snapshots", controller.createSnapshot);
router.get(
  "/snapshots/:snapshotId/resources/:resource",
  ...validator.validateSnapshotPage,
  controller.getSnapshotPage,
);
router.delete(
  "/snapshots/:snapshotId",
  validator.validateSnapshotId,
  controller.deleteSnapshot,
);
export default router;

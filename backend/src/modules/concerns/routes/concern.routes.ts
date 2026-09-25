import express from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import {
  addConcernMessage,
  createConcern,
  getConcern,
  listConcerns,
  updateConcernStatus,
} from "../controllers/concern.controller";
import {
  validateConcernIdParams,
  validateConcernListQuery,
  validateConcernMessage,
  validateConcernStatus,
  validateCreateConcern,
} from "../validators/concern.validator";

const router = express.Router();
router.use(authenticateToken);

router.post("/", requireRole("parent"), validateCreateConcern, createConcern);
router.get(
  "/",
  requireRole("parent", "barangay_captain"),
  validateConcernListQuery,
  listConcerns,
);
router.get(
  "/:id",
  requireRole("parent", "barangay_captain"),
  validateConcernIdParams,
  getConcern,
);
router.post(
  "/:id/messages",
  requireRole("parent", "barangay_captain"),
  validateConcernIdParams,
  validateConcernMessage,
  addConcernMessage,
);
router.patch(
  "/:id/status",
  requireRole("barangay_captain"),
  validateConcernIdParams,
  validateConcernStatus,
  updateConcernStatus,
);

export default router;

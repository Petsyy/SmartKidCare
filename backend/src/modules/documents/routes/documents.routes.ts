import express from "express";
import {
  issueChildDocumentAccessToken,
  viewDocument,
} from "../controllers/documents.controller";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";
import {
  validateDocumentAccessParams,
  validateDocumentViewQuery,
} from "../validators/documents.validator";

const router = express.Router();

router.get("/view", validateDocumentViewQuery, viewDocument);
router.get(
  "/children/:id/:documentType/access",
  authenticateToken,
  requireRole("barangay_captain", "teacher", "parent"),
  validateDocumentAccessParams,
  issueChildDocumentAccessToken,
);

export default router;

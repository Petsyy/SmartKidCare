import express from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import upload from "../../../shared/middleware/upload.middleware";
import {
  submitChildEnrollment,
  getCenters,
} from "../controllers/enrollment.controller";
import {
  verifyDocument,
  getDocumentVerification,
  confirmDocument,
} from "../controllers/enrollment.controller";
import { requireRole } from "../../../shared/middleware/role.middleware";
import { documentVerificationLimiter } from "../../../shared/lib/rate-limit";
import { validate } from "../../../shared/middleware/validate.middleware";
import {
  confirmationParamsSchema,
  verifyDocumentBodySchema,
} from "../validators/document-verification.validator";
import { documentVerificationUpload } from "../../../shared/middleware/document-verification-upload.middleware";

const router = express.Router();

router.use(authenticateToken);

router.get("/centers", getCenters);

router.post(
  "/documents/verify",
  requireRole("teacher"),
  documentVerificationLimiter,
  documentVerificationUpload.single("file"),
  validate(verifyDocumentBodySchema),
  verifyDocument,
);
router.get(
  "/documents/:verificationId",
  requireRole("teacher"),
  validate(confirmationParamsSchema, "params"),
  getDocumentVerification,
);
router.post(
  "/documents/:verificationId/confirm",
  requireRole("teacher"),
  validate(confirmationParamsSchema, "params"),
  confirmDocument,
);

router.post(
  "/",
  upload.fields([
    { name: "birthCertificate", maxCount: 1 },
    { name: "parentId", maxCount: 1 },
  ]),
  submitChildEnrollment,
);

export default router;

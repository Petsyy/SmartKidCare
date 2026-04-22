import express from "express";
import {
  getChildren,
  getMyChildren,
  getChildById,
} from "./controllers";
import {
  createChild,
  deleteChild,
  updateChild,
} from "./controllers";
import { getChildBlockchainProof } from "./blockchain";
import {
  getChildDocumentSignedUrl,
  getChildDocumentUrl,
  streamChildDocument,
} from "./documents";
import {
  deleteEnrollmentRequest,
  getEnrollmentRequestParentCredentials,
  getEnrollmentCenters,
  getEnrollmentRequests,
  getMyEnrollmentRequests,
  resetEnrollmentRequestParentPassword,
  reviewEnrollmentRequest,
  submitChildEnrollmentRequest,
} from "./enrollment/enrollment.controller";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import upload from "../../shared/middleware/upload.middleware";

const router = express.Router();

router.get("/", authenticateToken, getChildren);
router.get("/my-children", authenticateToken, getMyChildren);
router.get("/enrollment-centers", authenticateToken, getEnrollmentCenters);
router.get("/enrollment-requests", authenticateToken, getEnrollmentRequests);
router.get(
  "/enrollment-requests/mine",
  authenticateToken,
  getMyEnrollmentRequests,
);
router.patch(
  "/enrollment-requests/:id/review",
  authenticateToken,
  reviewEnrollmentRequest,
);
router.delete(
  "/enrollment-requests/:id",
  authenticateToken,
  deleteEnrollmentRequest,
);
router.get(
  "/enrollment-requests/:id/parent-credentials",
  authenticateToken,
  getEnrollmentRequestParentCredentials,
);
router.post(
  "/enrollment-requests/:id/reset-parent-password",
  authenticateToken,
  resetEnrollmentRequestParentPassword,
);
router.post(
  "/enrollment-requests",
  authenticateToken,
  upload.fields([
    { name: "birthCertificate", maxCount: 1 },
    { name: "parentId", maxCount: 1 },
  ]),
  submitChildEnrollmentRequest,
);
router.get("/:id/blockchain-proof", authenticateToken, getChildBlockchainProof);
router.get(
  "/:id/documents/:documentType/url",
  authenticateToken,
  getChildDocumentSignedUrl,
);
router.get("/document-access/:token", getChildDocumentUrl);
router.get("/document-stream/:token", streamChildDocument);
router.get("/:id", authenticateToken, getChildById);
router.patch("/:id", authenticateToken, updateChild);
router.delete("/:id", authenticateToken, deleteChild);

router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "birthCertificate", maxCount: 1 },
    { name: "parentId", maxCount: 1 },
  ]),
  createChild,
);

export default router;


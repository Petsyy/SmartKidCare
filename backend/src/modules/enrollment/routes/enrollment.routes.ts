import express from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import upload from "../../../shared/middleware/upload.middleware";
import {
  deleteEnrollmentRequest,
  getEnrollmentRequestParentCredentials,
  getEnrollmentCenters,
  getEnrollmentRequests,
  getMyEnrollmentRequests,
  resetEnrollmentRequestParentPassword,
  reviewEnrollmentRequest,
  submitChildEnrollmentRequest,
} from "../controllers/enrollment.controller";

const router = express.Router();

router.use(authenticateToken);

router.get("/centers", getEnrollmentCenters);
router.get("/requests", getEnrollmentRequests);
router.get("/requests/mine", getMyEnrollmentRequests);

router.post(
  "/requests",
  upload.fields([
    { name: "birthCertificate", maxCount: 1 },
    { name: "parentId", maxCount: 1 },
  ]),
  submitChildEnrollmentRequest,
);

router.patch("/requests/:id/review", reviewEnrollmentRequest);
router.delete("/requests/:id", deleteEnrollmentRequest);
router.get("/requests/:id/parent-credentials", getEnrollmentRequestParentCredentials);
router.post("/requests/:id/reset-parent-password", resetEnrollmentRequestParentPassword);

export default router;

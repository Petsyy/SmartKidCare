import express from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import upload from "../../../shared/middleware/upload.middleware";
import {
  deleteEnrollmentRequest,
  getEnrollmentCenters,
  getEnrollmentRequests,
  getMyEnrollmentRequests,
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
export default router;

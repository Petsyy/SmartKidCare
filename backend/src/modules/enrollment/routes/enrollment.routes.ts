import express from "express";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import upload from "../../../shared/middleware/upload.middleware";
import { submitChildEnrollment } from "../controllers/enrollment.controller";

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  upload.fields([
    { name: "birthCertificate", maxCount: 1 },
    { name: "parentId", maxCount: 1 },
  ]),
  submitChildEnrollment,
);

export default router;

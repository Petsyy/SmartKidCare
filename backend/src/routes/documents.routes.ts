import express from "express";
import { viewDocument } from "../controllers/child/child.controller";

const router = express.Router();

// Public endpoint to view document securely using query parameter token
// Format: /api/documents/view?token=xxxxx
router.get("/view", viewDocument);

export default router;

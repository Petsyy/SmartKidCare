import express from "express";
import {
  createChild,
  getChildren,
  linkChildToParent
} from "../controllers/child.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * Admin only: enroll child (auto-creates parent)
 */
router.post("/", authenticateToken, createChild);

/**
 * Admin / Worker: view children
 */
router.get("/", authenticateToken, getChildren);

/** Parent: link child to own account
 */
router.post("/link", authenticateToken, linkChildToParent);

export default router;

import express from "express";
import {
  createChild,
  getChildren,
  getChildById,
  getMyChildren,
  linkChildToParent,
  updateChild,
} from "../controllers/child.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * Admin only: enroll child (auto-creates parent)
 */
router.post("/", authenticateToken, createChild);

/**
 * Admin / Teacher: view children
 */
router.get("/", authenticateToken, getChildren);

/**
 * Parent: get own linked children (MUST come before /:id)
 */
router.get("/my-children", authenticateToken, getMyChildren);

/**
 * Admin / Teacher: get single child by ID with parent info
 */
router.get("/:id", authenticateToken, getChildById);

/**
 * Admin: update child (edit, change status, regenerate link code, unlink parent)
 */
router.patch("/:id", authenticateToken, updateChild);

/** Parent: link child to own account
 */
router.post("/link", authenticateToken, linkChildToParent);

export default router;

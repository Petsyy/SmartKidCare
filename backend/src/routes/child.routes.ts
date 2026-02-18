import express from "express";
import {
  createChild,
  deleteChild,
  getChildren,
  getChildById,
  getMyChildren,
  linkChildToParent,
  updateChild,
} from "../controllers/child.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/", authenticateToken, createChild);
router.get("/", authenticateToken, getChildren);
router.get("/my-children", authenticateToken, getMyChildren);
router.get("/:id", authenticateToken, getChildById);
router.patch("/:id", authenticateToken, updateChild);
router.delete("/:id", authenticateToken, deleteChild);
router.post("/link", authenticateToken, linkChildToParent);

export default router;

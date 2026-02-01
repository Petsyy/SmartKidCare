import express from "express";
import {
  createChild,
  linkChildToParent,
  getChildren,
} from "../controllers/child.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/", authenticateToken, createChild);

router.post("/link", authenticateToken, linkChildToParent);

router.get("/", authenticateToken, getChildren);

export default router;

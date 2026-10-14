import express from "express";
import { getChildBlockchainProof } from "./controllers/blockchain.controller";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import { requireRole } from "../../shared/middleware/role.middleware";
import { validateBlockchainProofParams } from "./validators/blockchain.validator";

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/proof/:id",
  requireRole("barangay_captain", "teacher", "parent"),
  validateBlockchainProofParams,
  getChildBlockchainProof,
);

export default router;

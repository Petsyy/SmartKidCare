import express from "express";
import { getChildBlockchainProof } from "./controllers/blockchain.controller";
import { authenticateToken } from "../../shared/middleware/auth.middleware";

const router = express.Router();

router.use(authenticateToken);

router.get("/proof/:id", getChildBlockchainProof);

export default router;

import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { blockchainProofService } from "../services/blockchain-proof.service";

export const getChildBlockchainProof = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await blockchainProofService.getProof(
      req.user,
      String(req.params.id || ""),
    );
    res.status(200).json(result);
  },
);

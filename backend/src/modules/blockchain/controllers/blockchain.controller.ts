import type { Request, Response } from "express";
import { getChildBlockchainProofData } from "../services/blockchain-proof.service";

export const getChildBlockchainProof = async (req: Request, res: Response) => {
  try {
    const result = await getChildBlockchainProofData(
      req.user,
      String(req.params.id || ""),
    );
    return res.status(result.status).json(result.body);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to load child blockchain proof",
      error: error?.message,
    });
  }
};

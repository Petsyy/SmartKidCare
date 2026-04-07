import mongoose from "mongoose";
import { Request, Response } from "express";
import Child from "../../models/Child";
import {
  documentsRegistryContract,
  buildChildIdHash,
  buildDocumentsHash,
} from "../../blockchain/ethers";
import { ensureCanAccessChild, ZERO_HASH } from "./child.helpers";

export const getChildBlockchainProof = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const childId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return res.status(400).json({ message: "Invalid child ID" });
    }

    const child = await Child.findById(childId)
      .populate("parent", "_id")
      .populate("teacher", "_id")
      .select("studentId documents documentIntegrity parent teacher")
      .lean();

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    if (!ensureCanAccessChild(child, req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const studentId = String((child as any).studentId || "").trim();
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is missing" });
    }

    const birthHash =
      String((child as any)?.documents?.birthCertificate?.hash || "").trim() ||
      ZERO_HASH;
    const parentIdHash =
      String((child as any)?.documents?.parentId?.hash || "").trim() ||
      ZERO_HASH;

    const childIdHash = buildChildIdHash(studentId);
    const documentsHash = buildDocumentsHash(birthHash, parentIdHash);

    let verifiedOnChain = false;
    let onChainDocumentsHash: string | null = null;

    try {
      verifiedOnChain = await documentsRegistryContract.verifyDocuments(
        childIdHash,
        documentsHash,
      );
      onChainDocumentsHash =
        await documentsRegistryContract.getDocumentsHash(childIdHash);
    } catch (error) {
      console.error("DocumentsRegistry proof read failed:", error);
    }

    const txHash = String(
      (child as any)?.documentIntegrity?.txHash || "",
    ).trim();
    const network = "Sepolia";
    const etherscanUrl = txHash
      ? `https://sepolia.etherscan.io/tx/${txHash}`
      : null;

    return res.json({
      network,
      txHash: txHash || null,
      etherscanUrl,
      blockNumber: (child as any)?.documentIntegrity?.blockNumber ?? null,
      anchoredAt: (child as any)?.documentIntegrity?.anchoredAt ?? null,
      childIdHash,
      localDocumentsHash: documentsHash,
      onChainDocumentsHash,
      verifiedOnChain,
      documents: {
        birthCertificate: {
          hasDocument: Boolean(
            (child as any)?.documents?.birthCertificate?.publicId,
          ),
          hash: birthHash === ZERO_HASH ? null : birthHash,
          blockchainVerified:
            Boolean((child as any)?.documents?.birthCertificate?.publicId) &&
            verifiedOnChain,
        },
        parentId: {
          hasDocument: Boolean((child as any)?.documents?.parentId?.publicId),
          hash: parentIdHash === ZERO_HASH ? null : parentIdHash,
          blockchainVerified:
            Boolean((child as any)?.documents?.parentId?.publicId) &&
            verifiedOnChain,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to load child blockchain proof",
      error: error?.message,
    });
  }
};

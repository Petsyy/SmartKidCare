import mongoose from "mongoose";
import Child from "../../../models/Child";
import {
  documentsRegistryContract,
  buildChildIdHash,
  buildDocumentsHash,
} from "../utils/ethers";
import { canAccessChild } from "../../../shared/services/child-access.service";
import { normalizeString } from "../../../shared/utils/string.utils";
import type { ChildServiceResponse, AuthUser } from "../types/blockchain-proof.types";

const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const getChildBlockchainProofData = async (
  user: AuthUser | undefined,
  childIdInput: string,
): Promise<ChildServiceResponse> => {
  if (!user?.id) {
    return {
      status: 401,
      body: { message: "Unauthorized" },
    };
  }

  const childId = String(childIdInput || "");
  if (!mongoose.Types.ObjectId.isValid(childId)) {
    return {
      status: 400,
      body: { message: "Invalid child ID" },
    };
  }

  const child = await Child.findById(childId)
    .populate("parent", "_id")
    .populate("teacher", "_id")
    .select("studentId documents documentIntegrity parent teacher daycareCenter")
    .lean();

  if (!child) {
    return {
      status: 404,
      body: { message: "Child not found" },
    };
  }

  const canAccess = canAccessChild(user as any, child);
  if (!canAccess) {
    return {
      status: 403,
      body: { message: "Forbidden" },
    };
  }

  const studentId = String((child as any).studentId || "").trim();
  if (!studentId) {
    return {
      status: 400,
      body: { message: "Student ID is missing" },
    };
  }

  const birthHash =
    String((child as any)?.documents?.birthCertificate?.hash || "").trim() ||
    ZERO_HASH;
  const parentIdHash =
    String((child as any)?.documents?.parentId?.hash || "").trim() || ZERO_HASH;

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

  const txHash = String((child as any)?.documentIntegrity?.txHash || "").trim();
  const network = "Sepolia";
  const etherscanUrl = txHash
    ? `https://sepolia.etherscan.io/tx/${txHash}`
    : null;

  return {
    status: 200,
    body: {
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
          hasDocument: Boolean((child as any)?.documents?.birthCertificate?.publicId),
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
    },
  };
};

export type { ChildServiceResponse } from "../types/blockchain-proof.types";

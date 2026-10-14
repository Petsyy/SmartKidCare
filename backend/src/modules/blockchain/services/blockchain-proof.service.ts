import mongoose from "mongoose";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/app-error";
import { canAccessChild } from "../../../shared/services/child-access.service";
import { buildChildIdHash } from "../utils/ethers";
import { blockchainRepository, type BlockchainRepository } from "../repositories/blockchain.repository";
import { blockchainClient, type BlockchainClient, resolveDocumentHashes } from "./blockchain.service";
import type { AuthUser, BlockchainAnchorStatus } from "../types/blockchain-proof.types";

type ProofDependencies = {
  repository: BlockchainRepository;
  client: BlockchainClient;
};

export class BlockchainProofService {
  constructor(private readonly deps: ProofDependencies) {}

  async getProof(user: AuthUser | undefined, childIdInput: string) {
    if (!user?.id) throw new UnauthorizedError();
    const childId = String(childIdInput || "").trim();
    if (!mongoose.Types.ObjectId.isValid(childId)) {
      throw new ValidationError("Invalid child ID");
    }

    const child = await this.deps.repository.findForProof(childId);
    if (!child) throw new NotFoundError("Child");
    if (!canAccessChild(user as never, child)) throw new ForbiddenError();

    const documents = child.documents as {
      birthCertificate?: { publicId?: string; hash?: string | null };
      parentId?: { publicId?: string; hash?: string | null };
    } | undefined;
    const integrity = child.documentIntegrity as {
      status?: BlockchainAnchorStatus | null;
      txHash?: string | null;
      blockNumber?: number | null;
      anchoredAt?: Date | null;
      attemptCount?: number;
      lastAttemptAt?: Date | null;
      nextAttemptAt?: Date | null;
      lastErrorCode?: string | null;
    } | undefined;
    const resolved = resolveDocumentHashes(
      documents?.birthCertificate?.hash,
      documents?.parentId?.hash,
    );
    if (!resolved) throw new ValidationError("No valid document hashes are available");

    const childIdHash = buildChildIdHash(childId);
    let verifiedOnChain: boolean;
    let onChainDocumentsHash: string;
    try {
      onChainDocumentsHash = await this.deps.client.getStoredDocumentsHash(childIdHash);
      verifiedOnChain =
        onChainDocumentsHash === resolved.documentsHash.toLowerCase();
    } catch {
      throw new AppError(
        503,
        "Blockchain verification is temporarily unavailable.",
        true,
        "RPC_UNAVAILABLE",
      );
    }

    const txHash = String(integrity?.txHash || "").trim() || null;
    return {
      network: "Sepolia",
      networkAvailable: true,
      anchorStatus: integrity?.status || "pending",
      verifiedOnChain,
      txHash,
      etherscanUrl: txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null,
      blockNumber: integrity?.blockNumber ?? null,
      anchoredAt: integrity?.anchoredAt ?? null,
      attemptCount: integrity?.attemptCount ?? 0,
      lastAttemptAt: integrity?.lastAttemptAt ?? null,
      nextAttemptAt: integrity?.nextAttemptAt ?? null,
      errorCode: integrity?.lastErrorCode ?? null,
      childIdHash,
      localDocumentsHash: resolved.documentsHash,
      onChainDocumentsHash,
      documents: {
        birthCertificate: {
          hasDocument: Boolean(documents?.birthCertificate?.publicId),
          hash: documents?.birthCertificate?.hash || null,
          blockchainVerified:
            Boolean(documents?.birthCertificate?.publicId) && verifiedOnChain,
        },
        parentId: {
          hasDocument: Boolean(documents?.parentId?.publicId),
          hash: documents?.parentId?.hash || null,
          blockchainVerified: Boolean(documents?.parentId?.publicId) && verifiedOnChain,
        },
      },
    };
  }
}

export const blockchainProofService = new BlockchainProofService({
  repository: blockchainRepository,
  client: blockchainClient,
});

import { randomUUID } from "crypto";
import { logger } from "../../../shared/lib/logger";
import { buildChildIdHash, documentsRegistryAddress, SEPOLIA_CHAIN_ID } from "../utils/ethers";
import { blockchainRepository, type BlockchainRepository } from "../repositories/blockchain.repository";
import {
  blockchainClient,
  type BlockchainClient,
  classifyBlockchainError,
  resolveDocumentHashes,
  ZERO_HASH,
} from "./blockchain.service";
import type { BlockchainErrorCode, ClaimedBlockchainChild } from "../types/blockchain-proof.types";

const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
const PROCESSING_LEASE_MS = 2 * 60_000;
const WRITER_LEASE_MS = 2 * 60_000;

type AnchorDependencies = {
  repository: BlockchainRepository;
  client: BlockchainClient;
  now: () => Date;
};

const isTerminalError = (code: BlockchainErrorCode) =>
  [
    "SIGNER_NOT_AUTHORIZED",
    "TRANSACTION_REVERTED",
    "ON_CHAIN_HASH_CONFLICT",
    "INVALID_DOCUMENT_HASH",
  ].includes(code);

export class BlockchainAnchorService {
  constructor(private readonly deps: AnchorDependencies) {}

  async enqueue(childId: string): Promise<void> {
    await this.deps.repository.initializePending(childId);
  }

  private async deferOrFail(
    childId: string,
    attemptCount: number,
    errorCode: BlockchainErrorCode,
  ): Promise<void> {
    if (isTerminalError(errorCode) || attemptCount >= MAX_ATTEMPTS) {
      await this.fail(childId, attemptCount, errorCode);
      return;
    }

    const delay = RETRY_DELAYS_MS[Math.max(0, attemptCount - 1)];
    const nextAttemptAt = new Date(this.deps.now().getTime() + delay);
    await this.deps.repository.markRetry(
      childId,
      errorCode,
      nextAttemptAt,
    );
    logger.warn("🔁 [Blockchain] Enrollment document anchor retry scheduled.", {
      childId,
      attemptCount,
      errorCode,
      nextAttemptAt: nextAttemptAt.toISOString(),
    });
  }

  private async fail(
    childId: string,
    attemptCount: number,
    errorCode: BlockchainErrorCode,
  ): Promise<void> {
    await this.deps.repository.markFailed(childId, errorCode);
    logger.error("🛑 [Blockchain] Enrollment document anchoring failed.", {
      childId,
      attemptCount,
      errorCode,
    });
  }

  private async confirmFromReceipt(
    childId: string,
    childIdHash: string,
    documentsHash: string,
    txHash: string | null,
    blockNumber: number | null,
  ): Promise<boolean> {
    const storedHash = await this.deps.client.getStoredDocumentsHash(childIdHash);
    if (storedHash !== documentsHash.toLowerCase()) return false;

    await this.deps.repository.markConfirmed(childId, {
      childIdHash,
      documentsHash,
      txHash,
      blockNumber,
      chainId: SEPOLIA_CHAIN_ID,
      contractAddress: documentsRegistryAddress,
      anchoredAt: this.deps.now(),
    });
    logger.info("✅ [Blockchain] Enrollment documents confirmed on Sepolia.", {
      childId,
      txHash,
      blockNumber,
      status: "confirmed",
    });
    return true;
  }

  async processClaimedChild(child: ClaimedBlockchainChild): Promise<void> {
    const childId = String(child._id);
    const attemptCount = Number(child.documentIntegrity?.attemptCount || 1);
    logger.info("⛓️ [Blockchain] Processing enrollment document anchor.", {
      childId,
      attemptCount,
      status: "processing",
    });
    const resolved = resolveDocumentHashes(
      child.documents?.birthCertificate?.hash,
      child.documents?.parentId?.hash,
    );

    if (!resolved) {
      await this.fail(childId, attemptCount, "INVALID_DOCUMENT_HASH");
      return;
    }

    const childIdHash = buildChildIdHash(childId);
    const existingTxHash = String(child.documentIntegrity?.txHash || "").trim();

    try {
      if (existingTxHash) {
        const receipt = await this.deps.client.getTransactionReceipt(existingTxHash);
        if (!receipt) {
          await this.deferOrFail(childId, attemptCount, "TRANSACTION_PENDING");
          return;
        }
        if (receipt.status !== 1) {
          await this.fail(childId, attemptCount, "TRANSACTION_REVERTED");
          return;
        }
        if (
          await this.confirmFromReceipt(
            childId,
            childIdHash,
            resolved.documentsHash,
            existingTxHash,
            receipt.blockNumber,
          )
        ) {
          return;
        }
        await this.fail(childId, attemptCount, "ON_CHAIN_HASH_CONFLICT");
        return;
      }

      const onChainHash = await this.deps.client.getStoredDocumentsHash(childIdHash);
      if (onChainHash === resolved.documentsHash.toLowerCase()) {
        await this.confirmFromReceipt(
          childId,
          childIdHash,
          resolved.documentsHash,
          null,
          null,
        );
        return;
      }
      if (onChainHash !== ZERO_HASH.toLowerCase()) {
        await this.fail(childId, attemptCount, "ON_CHAIN_HASH_CONFLICT");
        return;
      }

      const transaction = await this.deps.client.broadcastDocumentsHash(
        childIdHash,
        resolved.documentsHash,
      );
      await this.deps.repository.markBroadcast(childId, transaction.hash);
      logger.info("📡 [Blockchain] Sepolia transaction broadcast.", {
        childId,
        attemptCount,
        txHash: transaction.hash,
      });
      const receipt = await this.deps.client.waitForTransaction(transaction.hash);
      if (!receipt) {
        await this.deferOrFail(childId, attemptCount, "TRANSACTION_PENDING");
        return;
      }
      if (receipt.status !== 1) {
        await this.fail(childId, attemptCount, "TRANSACTION_REVERTED");
        return;
      }
      if (
        !(await this.confirmFromReceipt(
          childId,
          childIdHash,
          resolved.documentsHash,
          transaction.hash,
          receipt.blockNumber,
        ))
      ) {
        await this.fail(childId, attemptCount, "ON_CHAIN_HASH_CONFLICT");
      }
    } catch (error: unknown) {
      const errorCode = classifyBlockchainError(error);
      await this.deferOrFail(childId, attemptCount, errorCode);
    }
  }

  async processNext(): Promise<boolean> {
    const ownerId = randomUUID();
    const now = this.deps.now();
    const acquired = await this.deps.repository.acquireWriterLock(
      ownerId,
      now,
      new Date(now.getTime() + WRITER_LEASE_MS),
    );
    if (!acquired) return false;

    try {
      const child = await this.deps.repository.claimNext(
        now,
        new Date(now.getTime() + PROCESSING_LEASE_MS),
      );
      if (!child) return false;
      await this.processClaimedChild(child);
      return true;
    } finally {
      await this.deps.repository.releaseWriterLock(ownerId);
    }
  }
}

export const blockchainAnchorService = new BlockchainAnchorService({
  repository: blockchainRepository,
  client: blockchainClient,
  now: () => new Date(),
});

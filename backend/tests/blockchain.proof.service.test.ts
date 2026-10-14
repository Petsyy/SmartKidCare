import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { BlockchainRepository } from "../src/modules/blockchain/repositories/blockchain.repository";
import type { BlockchainClient } from "../src/modules/blockchain/services/blockchain.service";
import { resolveDocumentHashes } from "../src/modules/blockchain/services/blockchain.service";
import { BlockchainProofService } from "../src/modules/blockchain/services/blockchain-proof.service";
import { ethers } from "../src/modules/blockchain/utils/ethers";

const childId = "671a2b3c4d5e6f7890123456";
const parentId = "671a2b3c4d5e6f7890123457";
const birthHash = ethers.id("birth");
const resolved = resolveDocumentHashes(birthHash, null)!;

const child = {
  _id: childId,
  parent: { _id: parentId },
  teacher: null,
  daycareCenter: null,
  documents: { birthCertificate: { publicId: "birth", hash: birthHash } },
  documentIntegrity: { status: "confirmed", blockchainVerified: true },
};

describe("BlockchainProofService", () => {
  it("should return a live verified proof to the child's parent", async () => {
    const repository = {
      findForProof: async () => child,
    } as unknown as BlockchainRepository;
    const client = {
      getStoredDocumentsHash: async () => resolved.documentsHash,
    } as unknown as BlockchainClient;
    const service = new BlockchainProofService({ repository, client });

    const result = await service.getProof(
      { id: parentId, role: "parent" },
      childId,
    );
    assert.equal(result.verifiedOnChain, true);
    assert.equal(result.anchorStatus, "confirmed");
  });

  it("should reject a parent who does not own the child", async () => {
    const repository = {
      findForProof: async () => child,
    } as unknown as BlockchainRepository;
    const client = {} as BlockchainClient;
    const service = new BlockchainProofService({ repository, client });
    await assert.rejects(
      () =>
        service.getProof(
          { id: "671a2b3c4d5e6f7890123458", role: "parent" },
          childId,
        ),
      { name: "ForbiddenError" },
    );
  });

  it("should return a safe 503 when Sepolia is unavailable", async () => {
    const repository = {
      findForProof: async () => child,
    } as unknown as BlockchainRepository;
    const client = {
      getStoredDocumentsHash: async () => {
        throw new Error("private provider details");
      },
    } as unknown as BlockchainClient;
    const service = new BlockchainProofService({ repository, client });

    await assert.rejects(
      () => service.getProof({ id: parentId, role: "parent" }, childId),
      (error: unknown) => {
        const candidate = error as {
          statusCode?: number;
          code?: string;
          message?: string;
        };
        assert.equal(candidate.statusCode, 503);
        assert.equal(candidate.code, "RPC_UNAVAILABLE");
        assert.equal(candidate.message?.includes("private provider"), false);
        return true;
      },
    );
  });

  it("should report a live mismatch without claiming verification", async () => {
    const repository = {
      findForProof: async () => child,
    } as unknown as BlockchainRepository;
    const client = {
      getStoredDocumentsHash: async () => ethers.id("conflicting-documents"),
    } as unknown as BlockchainClient;
    const service = new BlockchainProofService({ repository, client });

    const result = await service.getProof(
      { id: parentId, role: "parent" },
      childId,
    );
    assert.equal(result.verifiedOnChain, false);
    assert.equal(result.anchorStatus, "confirmed");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { BlockchainRepository } from "../src/modules/blockchain/repositories/blockchain.repository";
import type { BlockchainClient } from "../src/modules/blockchain/services/blockchain.service";
import { BlockchainAnchorService } from "../src/modules/blockchain/services/blockchain-anchor.service";
import { buildChildIdHash, buildDocumentsHash, ethers } from "../src/modules/blockchain/utils/ethers";

const childId = "671a2b3c4d5e6f7890123456";
const birthHash = ethers.id("birth-document");
const parentHash = ethers.id("parent-document");
const documentsHash = buildDocumentsHash(birthHash, parentHash);

const createHarness = (onChainHash = ethers.ZeroHash) => {
  const events: Array<{ name: string; args: unknown[] }> = [];
  const repository = {
    markConfirmed: async (...args: unknown[]) => events.push({ name: "confirmed", args }),
    markFailed: async (...args: unknown[]) => events.push({ name: "failed", args }),
    markRetry: async (...args: unknown[]) => events.push({ name: "retry", args }),
    markBroadcast: async (...args: unknown[]) => events.push({ name: "broadcast", args }),
  } as unknown as BlockchainRepository;
  const client = {
    getStoredDocumentsHash: async () => onChainHash,
    getTransactionReceipt: async () => null,
    broadcastDocumentsHash: async () => {
      events.push({ name: "sent", args: [] });
      return { hash: `0x${"1".repeat(64)}` };
    },
    waitForTransaction: async () => ({ status: 1, blockNumber: 123 }),
  } as unknown as BlockchainClient;
  const service = new BlockchainAnchorService({
    repository,
    client,
    now: () => new Date("2026-10-13T00:00:00.000Z"),
  });
  return { service, events };
};

const claimedChild = {
  _id: childId,
  documents: {
    birthCertificate: { hash: birthHash },
    parentId: { hash: parentHash },
  },
  documentIntegrity: { attemptCount: 1 },
};

describe("BlockchainAnchorService", () => {
  it("should confirm an already matching on-chain hash without a transaction", async () => {
    const { service, events } = createHarness(documentsHash);
    await service.processClaimedChild(claimedChild);
    assert.equal(events.some((event) => event.name === "sent"), false);
    assert.equal(events[events.length - 1]?.name, "confirmed");
  });

  it("should refuse to overwrite a conflicting on-chain hash", async () => {
    const { service, events } = createHarness(ethers.id("different"));
    await service.processClaimedChild(claimedChild);
    assert.equal(events.some((event) => event.name === "sent"), false);
    assert.equal(events[events.length - 1]?.name, "failed");
    assert.equal(
      events[events.length - 1]?.args[1],
      "ON_CHAIN_HASH_CONFLICT",
    );
  });

  it("should broadcast, persist, and confirm a new anchor", async () => {
    const events: Array<{ name: string; args: unknown[] }> = [];
    let readCount = 0;
    const repository = {
      markConfirmed: async (...args: unknown[]) => events.push({ name: "confirmed", args }),
      markFailed: async (...args: unknown[]) => events.push({ name: "failed", args }),
      markRetry: async (...args: unknown[]) => events.push({ name: "retry", args }),
      markBroadcast: async (...args: unknown[]) => events.push({ name: "broadcast", args }),
    } as unknown as BlockchainRepository;
    const client = {
      getStoredDocumentsHash: async () => (++readCount === 1 ? ethers.ZeroHash : documentsHash),
      broadcastDocumentsHash: async () => ({ hash: `0x${"2".repeat(64)}` }),
      waitForTransaction: async () => ({ status: 1, blockNumber: 456 }),
    } as unknown as BlockchainClient;
    const service = new BlockchainAnchorService({ repository, client, now: () => new Date() });

    await service.processClaimedChild(claimedChild);

    assert.deepEqual(events.map((event) => event.name), ["broadcast", "confirmed"]);
  });

  it("should derive a stable domain-separated child hash", () => {
    assert.equal(buildChildIdHash(childId), buildChildIdHash(childId.toUpperCase()));
    assert.notEqual(buildChildIdHash(childId), ethers.id(childId));
    assert.throws(() => buildChildIdHash("not-an-object-id"));
  });

  it("should schedule a retry when the RPC is temporarily unavailable", async () => {
    const events: Array<{ name: string; args: unknown[] }> = [];
    const repository = {
      markRetry: async (...args: unknown[]) => events.push({ name: "retry", args }),
      markFailed: async (...args: unknown[]) => events.push({ name: "failed", args }),
    } as unknown as BlockchainRepository;
    const client = {
      getStoredDocumentsHash: async () => {
        const error = new Error("network timeout") as Error & { code: string };
        error.code = "TIMEOUT";
        throw error;
      },
    } as unknown as BlockchainClient;
    const service = new BlockchainAnchorService({
      repository,
      client,
      now: () => new Date("2026-10-13T00:00:00.000Z"),
    });

    await service.processClaimedChild(claimedChild);

    assert.equal(events[0]?.name, "retry");
    assert.equal(events[0]?.args[1], "RPC_UNAVAILABLE");
    assert.equal(
      (events[0]?.args[2] as Date).toISOString(),
      "2026-10-13T00:01:00.000Z",
    );
  });

  it("should inspect a saved pending transaction instead of broadcasting again", async () => {
    const events: Array<{ name: string; args: unknown[] }> = [];
    const repository = {
      markRetry: async (...args: unknown[]) => events.push({ name: "retry", args }),
      markFailed: async (...args: unknown[]) => events.push({ name: "failed", args }),
    } as unknown as BlockchainRepository;
    const client = {
      getTransactionReceipt: async () => null,
      broadcastDocumentsHash: async () => {
        events.push({ name: "sent", args: [] });
        return { hash: "unexpected" };
      },
    } as unknown as BlockchainClient;
    const service = new BlockchainAnchorService({ repository, client, now: () => new Date() });

    await service.processClaimedChild({
      ...claimedChild,
      documentIntegrity: {
        attemptCount: 2,
        txHash: `0x${"3".repeat(64)}`,
      },
    });

    assert.equal(events.some((event) => event.name === "sent"), false);
    assert.equal(events[0]?.name, "retry");
    assert.equal(events[0]?.args[1], "TRANSACTION_PENDING");
  });

  it("should fail safely when a stored document hash is malformed", async () => {
    const events: Array<{ name: string; args: unknown[] }> = [];
    const repository = {
      markFailed: async (...args: unknown[]) => events.push({ name: "failed", args }),
    } as unknown as BlockchainRepository;
    const service = new BlockchainAnchorService({
      repository,
      client: {} as BlockchainClient,
      now: () => new Date(),
    });

    await service.processClaimedChild({
      ...claimedChild,
      documents: { birthCertificate: { hash: "not-a-keccak-hash" } },
    });

    assert.equal(events[0]?.name, "failed");
    assert.equal(events[0]?.args[1], "INVALID_DOCUMENT_HASH");
  });
});

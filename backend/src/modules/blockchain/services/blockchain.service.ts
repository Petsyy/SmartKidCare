import type { ContractTransactionResponse, TransactionReceipt } from "ethers";
import {
  buildDocumentsHash,
  getBlockchainRuntime,
  SEPOLIA_CHAIN_ID,
  ethers,
} from "../utils/ethers";
import type {
  BlockchainDocumentHashes,
  BlockchainErrorCode,
} from "../types/blockchain-proof.types";
import { logger } from "../../../shared/lib/logger";

export const ZERO_HASH = ethers.ZeroHash;

export const normalizeDocumentHash = (
  value: string | null | undefined,
): string | null => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  return /^0x[a-f0-9]{64}$/.test(normalized) ? normalized : null;
};

export const resolveDocumentHashes = (
  birthCertificateHash?: string | null,
  parentIdHash?: string | null,
): BlockchainDocumentHashes | null => {
  const birthInput = String(birthCertificateHash || "").trim();
  const parentInput = String(parentIdHash || "").trim();
  const birth = normalizeDocumentHash(birthCertificateHash);
  const parent = normalizeDocumentHash(parentIdHash);
  if ((birthInput && !birth) || (parentInput && !parent)) return null;
  if (!birth && !parent) return null;

  const resolvedBirth = birth || ZERO_HASH;
  const resolvedParent = parent || ZERO_HASH;
  return {
    birthCertificateHash: resolvedBirth,
    parentIdHash: resolvedParent,
    documentsHash: buildDocumentsHash(resolvedBirth, resolvedParent),
  };
};

export const classifyBlockchainError = (error: unknown): BlockchainErrorCode => {
  const value = error as {
    code?: string;
    revert?: { name?: string };
    errorName?: string;
    shortMessage?: string;
    message?: string;
  };
  const errorName = String(value?.revert?.name || value?.errorName || "");
  const message = String(value?.shortMessage || value?.message || "").toLowerCase();

  if (errorName === "NotAuthorized") return "SIGNER_NOT_AUTHORIZED";
  if (message.includes("insufficient funds")) return "INSUFFICIENT_FUNDS";
  if (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("socket") ||
    message.includes("server response") ||
    value?.code === "NETWORK_ERROR" ||
    value?.code === "TIMEOUT"
  ) {
    return "RPC_UNAVAILABLE";
  }
  if (message.includes("revert")) return "TRANSACTION_REVERTED";
  return "UNKNOWN_BLOCKCHAIN_ERROR";
};

export class BlockchainClient {
  async getStoredDocumentsHash(childIdHash: string): Promise<string> {
    const { documentsRegistryContract } = getBlockchainRuntime();
    return String(
      await documentsRegistryContract.getDocumentsHash(childIdHash),
    ).toLowerCase();
  }

  async verifyDocuments(childIdHash: string, documentsHash: string): Promise<boolean> {
    const { documentsRegistryContract } = getBlockchainRuntime();
    return Boolean(
      await documentsRegistryContract.verifyDocuments(childIdHash, documentsHash),
    );
  }

  async broadcastDocumentsHash(
    childIdHash: string,
    documentsHash: string,
  ): Promise<ContractTransactionResponse> {
    const { documentsRegistryContract } = getBlockchainRuntime();
    return documentsRegistryContract.storeDocumentsHash(
      childIdHash,
      documentsHash,
    ) as Promise<ContractTransactionResponse>;
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    const { provider } = getBlockchainRuntime();
    return provider.getTransactionReceipt(txHash);
  }

  async waitForTransaction(txHash: string): Promise<TransactionReceipt | null> {
    const { provider } = getBlockchainRuntime();
    const deadline = Date.now() + 60_000;
    let rpcWarningLogged = false;

    while (Date.now() < deadline) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) return receipt;
      } catch (error: unknown) {
        if (!rpcWarningLogged) {
          logger.warn("⏳ [Blockchain] Receipt lookup unavailable; retrying.", {
            txHash,
            errorCode: classifyBlockchainError(error),
          });
          rpcWarningLogged = true;
        }
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 5_000));
    }

    return null;
  }

  async getHealth() {
    const {
      documentsRegistryAddress,
      documentsRegistryContract,
      provider,
      wallet,
    } = getBlockchainRuntime();
    const [network, blockNumber, code, owner, balance] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      provider.getCode(documentsRegistryAddress),
      documentsRegistryContract.owner(),
      provider.getBalance(wallet.address),
    ]);

    return {
      healthy:
        Number(network.chainId) === SEPOLIA_CHAIN_ID &&
        code !== "0x" &&
        String(owner).toLowerCase() === wallet.address.toLowerCase() &&
        balance > 0n,
      chainId: Number(network.chainId),
      blockNumber,
      contractHasCode: code !== "0x",
      walletMatchesOwner:
        String(owner).toLowerCase() === wallet.address.toLowerCase(),
      walletFunded: balance > 0n,
    };
  }
}

export const blockchainClient = new BlockchainClient();

export async function getWalletBalance() {
  const { provider, wallet } = getBlockchainRuntime();
  const balance = await provider.getBalance(wallet.address);
  return {
    address: wallet.address,
    balance: balance.toString(),
    balanceInEth: ethers.formatEther(balance),
  };
}

export async function getGasComparison() {
  const { provider, wallet } = getBlockchainRuntime();
  const balance = await provider.getBalance(wallet.address);
  return {
    currentBalance: ethers.formatEther(balance),
    tracking: "Persisted transaction receipts should be used for gas reporting.",
  };
}

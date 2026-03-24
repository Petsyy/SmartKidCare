import { ChildDocumentIntegrity } from "../api/parent.api";
import { BLOCK_EXPLORER_BASE_URL } from "../config/config.api";

export type BlockchainStatusKey = "verified" | "pending" | "not_anchored";

export type BlockchainStatusInfo = {
  key: BlockchainStatusKey;
  label: string;
  detail: string;
  txHash: string | null;
  anchoredAt: string | null;
};

function normalizeHash(value: string | null | undefined): string | null {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export function getBlockchainStatusInfo(
  documentIntegrity?: ChildDocumentIntegrity | null,
): BlockchainStatusInfo {
  const txHash = normalizeHash(documentIntegrity?.txHash);
  const childIdHash = normalizeHash(documentIntegrity?.childIdHash);
  const documentsHash = normalizeHash(documentIntegrity?.documentsHash);
  const anchoredAt = String(documentIntegrity?.anchoredAt || "").trim() || null;

  if (txHash) {
    return {
      key: "verified",
      label: "Verified on Sepolia",
      detail: "Document hashes were anchored to the blockchain.",
      txHash,
      anchoredAt,
    };
  }

  if (childIdHash || documentsHash) {
    return {
      key: "pending",
      label: "Blockchain Pending",
      detail: "Document hashes were prepared but are not yet confirmed on-chain.",
      txHash: null,
      anchoredAt,
    };
  }

  return {
    key: "not_anchored",
    label: "Not Yet Anchored",
    detail: "No Sepolia transaction is stored for this child yet.",
    txHash: null,
    anchoredAt: null,
  };
}

export function getBlockchainStatusPalette(key: BlockchainStatusKey): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  dotColor: string;
} {
  if (key === "verified") {
    return {
      backgroundColor: "#ECFDF5",
      borderColor: "#A7F3D0",
      textColor: "#047857",
      dotColor: "#10B981",
    };
  }

  if (key === "pending") {
    return {
      backgroundColor: "#FFFBEB",
      borderColor: "#FDE68A",
      textColor: "#B45309",
      dotColor: "#F59E0B",
    };
  }

  return {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    textColor: "#4B5563",
    dotColor: "#9CA3AF",
  };
}

export function buildBlockchainTransactionUrl(
  txHash?: string | null,
): string | null {
  const normalizedHash = normalizeHash(txHash);
  if (!normalizedHash) {
    return null;
  }

  return `${BLOCK_EXPLORER_BASE_URL}/tx/${normalizedHash}`;
}

export function shortenHash(
  value: string | null | undefined,
  start = 10,
  end = 8,
): string {
  const normalized = normalizeHash(value);
  if (!normalized) {
    return "Pending";
  }

  if (normalized.length <= start + end + 3) {
    return normalized;
  }

  return `${normalized.slice(0, start)}...${normalized.slice(-end)}`;
}

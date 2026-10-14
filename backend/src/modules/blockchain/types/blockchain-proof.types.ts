export type BlockchainAnchorStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "failed";

export type BlockchainErrorCode =
  | "RPC_UNAVAILABLE"
  | "SIGNER_NOT_AUTHORIZED"
  | "INSUFFICIENT_FUNDS"
  | "TRANSACTION_REVERTED"
  | "TRANSACTION_PENDING"
  | "ON_CHAIN_HASH_CONFLICT"
  | "INVALID_DOCUMENT_HASH"
  | "UNKNOWN_BLOCKCHAIN_ERROR";

export type BlockchainDocumentHashes = {
  birthCertificateHash: string;
  parentIdHash: string;
  documentsHash: string;
};

export type ClaimedBlockchainChild = {
  _id: unknown;
  documents?: {
    birthCertificate?: { hash?: string | null };
    parentId?: { hash?: string | null };
  };
  documentIntegrity?: {
    txHash?: string | null;
    attemptCount?: number;
  };
};

export type AuthUser = {
  id: string;
  role: string;
  daycareCenterId?: string | null;
};

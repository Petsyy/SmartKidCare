import type { Child, ChildBlockchainProof, ChildDocumentType } from "@/types/child";

export type ChildDetailsTab = "profile" | "health" | "documents";

export type ChildDetailsModalProps = {
  child: Child | null;
  viewError: string | null;
  documentLoading: ChildDocumentType | null;
  blockchainProof: ChildBlockchainProof | null;
  blockchainProofLoading: boolean;
  blockchainProofError: string | null;
  onClose: () => void;
  onOpenDocument: (documentType: ChildDocumentType) => Promise<void>;
};

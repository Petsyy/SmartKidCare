import { ExternalLink, Loader2 } from "lucide-react";
import type {
  Child,
  ChildBlockchainProof,
  ChildDocumentType,
} from "@/types/child";
import { formatDate, formatTxDisplay } from "../utils";
import { DocumentCard, ErrorAlert, InfoCard } from "../cards";

interface DocumentsSectionProps {
  child: Child;
  tabId: string;
  documentLoading: ChildDocumentType | null;
  blockchainProof: ChildBlockchainProof | null;
  blockchainProofLoading: boolean;
  viewError: string | null;
  blockchainProofError: string | null;
  onOpenDocument: (documentType: ChildDocumentType) => Promise<void>;
}

export function DocumentsSection({
  child,
  tabId,
  documentLoading,
  blockchainProof,
  blockchainProofLoading,
  viewError,
  blockchainProofError,
  onOpenDocument,
}: DocumentsSectionProps) {
  const documentErrorMessage = viewError
    ? "This document could not be opened because the file was not found. It may have been removed or the record may need to be uploaded again."
    : null;
  const blockchainErrorMessage = blockchainProofError
    ? "Blockchain verification details are not available for this child yet."
    : null;

  return (
    <div
      id="documents-panel"
      role="tabpanel"
      aria-labelledby={tabId}
      className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
    >
      <div className="rounded-3xl border border-gray-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <p className="text-base font-bold tracking-[-0.01em] text-gray-900 dark:text-slate-100">
          Protected documents
        </p>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">
          Secure links are signed for a short time window before opening.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentCard
            label="Birth Certificate"
            description="Identity document for enrollment and verification."
            isAvailable={Boolean(child.documents?.birthCertificate?.publicId)}
            isLoading={documentLoading === "birth-certificate"}
            onOpen={() => onOpenDocument("birth-certificate")}
            verification={
              blockchainProof
                ? blockchainProof.documents.birthCertificate.blockchainVerified
                : undefined
            }
          />
          <DocumentCard
            label="Parent ID"
            description="Guardian identification for records and access review."
            isAvailable={Boolean(child.documents?.parentId?.publicId)}
            isLoading={documentLoading === "parent-id"}
            onOpen={() => onOpenDocument("parent-id")}
            verification={
              blockchainProof
                ? blockchainProof.documents.parentId.blockchainVerified
                : undefined
            }
          />
        </div>
      </div>

      {documentErrorMessage ? (
        <ErrorAlert
          tone="danger"
          title="Document unavailable"
          message={documentErrorMessage}
        />
      ) : null}
      {blockchainErrorMessage ? (
        <ErrorAlert
          tone="warning"
          title="Verification unavailable"
          message={blockchainErrorMessage}
        />
      ) : null}

      {blockchainProofLoading || blockchainProof ? (
        <div className="rounded-3xl border border-cyan-300/60 bg-cyan-50/80 p-5 shadow-sm dark:border-cyan-500/30 dark:bg-cyan-900/10">
          {blockchainProofLoading ? (
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-900 dark:text-cyan-100">
              <Loader2
                size={16}
                className="animate-spin motion-reduce:animate-none"
              />
              Verifying on blockchain...
            </div>
          ) : blockchainProof ? (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                  Blockchain identity
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoCard
                    label="Network"
                    value={blockchainProof.network || "N/A"}
                  />
                  <InfoCard
                    label="Transaction"
                    value={
                      <span className="font-mono text-xs">
                        {blockchainProof.txHash
                          ? formatTxDisplay(blockchainProof.txHash)
                          : "N/A"}
                      </span>
                    }
                    subvalue={
                      blockchainProof.anchoredAt
                        ? `Anchored ${formatDate(blockchainProof.anchoredAt)}`
                        : undefined
                    }
                  />
                </div>
              </div>

              {blockchainProof.etherscanUrl ? (
                <a
                  href={blockchainProof.etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700 underline decoration-cyan-500/60 underline-offset-2 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  View on Etherscan
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

import { createPortal } from "react-dom";
import {
  ExternalLink,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Child, ChildBlockchainProof, ChildDocumentType } from "@/types/child";

type ChildDetailsModalProps = {
  child: Child | null;
  viewError: string | null;
  documentLoading: ChildDocumentType | null;
  blockchainProof: ChildBlockchainProof | null;
  blockchainProofLoading: boolean;
  blockchainProofError: string | null;
  onClose: () => void;
  onOpenDocument: (documentType: ChildDocumentType) => Promise<void>;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString();
};

const formatFullName = (
  firstName?: string,
  middleName?: string,
  lastName?: string,
) =>
  [firstName, middleName, lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

const formatTxDisplay = (hash: string) => `${hash.slice(0, 14)}...`;

const VerificationStatus = ({ verified }: { verified: boolean }) => (
  <p
    className={`inline-flex items-center gap-2 text-xs font-medium ${
      verified ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
    }`}
  >
    {verified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
    {verified ? "Blockchain Verified" : "Blockchain Not Verified"}
  </p>
);

export default function ChildDetailsModal({
  child,
  viewError,
  documentLoading,
  blockchainProof,
  blockchainProofLoading,
  blockchainProofError,
  onClose,
  onOpenDocument,
}: ChildDetailsModalProps) {
  if (!child) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/55 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Child Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Review profile and protected documents
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Name
              </p>
              <p className="text-base font-medium text-gray-900 dark:text-slate-100">
                {formatFullName(child.firstName, child.middleName, child.lastName)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Age / Gender
                </p>
                <p className="text-sm text-gray-900 dark:text-slate-100">
                  {child.age} years / {child.gender}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </p>
                <p
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    child.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {child.status}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Student ID
              </p>
              <p className="font-mono text-sm text-gray-900 dark:text-slate-100">
                {child.studentId || "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                School Year
              </p>
              <p className="text-sm text-gray-900 dark:text-slate-100">
                {child.schoolYear || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Enrollment Date
              </p>
              <p className="text-sm text-gray-900 dark:text-slate-100">
                {formatDate(child.enrollmentDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date of Birth
              </p>
              <p className="text-sm text-gray-900 dark:text-slate-100">
                {formatDate(child.dateOfBirth)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Parent
              </p>
              <p className="text-sm text-gray-900 dark:text-slate-100">
                {child.parent
                  ? formatFullName(
                      child.parent.firstName,
                      child.parent.middleName,
                      child.parent.lastName,
                    )
                  : "Not linked"}
              </p>
              {child.parent?.email && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {child.parent.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Teacher
              </p>
              <p className="text-sm text-gray-900 dark:text-slate-100">
                {child.teacher
                  ? formatFullName(
                      child.teacher.firstName,
                      child.teacher.middleName,
                      child.teacher.lastName,
                    )
                  : "Unassigned"}
              </p>
              {child.teacher?.email && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {child.teacher.email}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Protected Documents
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Links are signed and expire in 60 seconds.
              </p>

              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDocument("birth-certificate")}
                  disabled={
                    documentLoading !== null || !child.documents?.birthCertificate?.publicId
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {documentLoading === "birth-certificate" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  View Birth Certificate
                </button>
                <VerificationStatus
                  verified={
                    blockchainProof?.documents.birthCertificate.blockchainVerified ?? false
                  }
                />

                <button
                  type="button"
                  onClick={() => onOpenDocument("parent-id")}
                  disabled={documentLoading !== null || !child.documents?.parentId?.publicId}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {documentLoading === "parent-id" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  View Parent ID
                </button>
                <VerificationStatus
                  verified={blockchainProof?.documents.parentId.blockchainVerified ?? false}
                />
              </div>

              <div className="mt-4 rounded-lg border border-cyan-200/80 bg-cyan-50/80 px-3 py-2.5 dark:border-cyan-500/30 dark:bg-cyan-500/10">
                {blockchainProofLoading ? (
                  <div className="inline-flex items-center gap-2 text-xs text-cyan-900 dark:text-cyan-100">
                    <Loader2 size={14} className="animate-spin" />
                    Verifying on blockchain...
                  </div>
                ) : blockchainProof ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
                      Network: {blockchainProof.network}
                    </p>
                    <p className="mt-1 text-xs text-cyan-900 dark:text-cyan-100">
                      Transaction: {blockchainProof.txHash ? formatTxDisplay(blockchainProof.txHash) : "Not available"}
                    </p>
                    {blockchainProof.etherscanUrl && (
                      <a
                        href={blockchainProof.etherscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-700 underline decoration-cyan-500/60 underline-offset-2 transition hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                      >
                        View on Etherscan
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-cyan-900 dark:text-cyan-100">
                    Blockchain proof is unavailable.
                  </p>
                )}
              </div>

              {blockchainProofError && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {blockchainProofError}
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Disabled buttons mean no document has been uploaded yet.
              </p>
            </div>

            {viewError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {viewError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

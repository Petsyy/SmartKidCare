import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldX, Copy, X, ExternalLink } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  data?: {
    isValid: boolean;
    dateHash?: string | null;
    rootHash?: string | null;
    txHash?: string | null;
    recordedBy?: string | null;
    timestamp?: number | null;
    reason?: string;
  } | null;
};

const EMPTY_VALUE = "-";

export default function VerificationModal({
  open,
  onClose,
  loading = false,
  data,
}: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) setIsVisible(true);
    if (!open) setCopiedKey(null);
  }, [open]);

  const dateHash = data?.dateHash || EMPTY_VALUE;
  const rootHash = data?.rootHash || EMPTY_VALUE;
  const txHash = data?.txHash || EMPTY_VALUE;
  const txExplorerUrl = txHash !== EMPTY_VALUE ? `https://sepolia.etherscan.io/tx/${txHash}` : null;
  const isValid = !!data?.isValid;

  const statusReason = useMemo(() => {
    if (loading) return null;
    if (isValid) return null;
    return (
      data?.reason ||
      "Record is not yet stored on-chain, or the chain hash does not match this record."
    );
  }, [data?.reason, isValid, loading]);

  const copyToClipboard = async (value: string, key: string) => {
    if (!value || value === EMPTY_VALUE) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // no-op
    }
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${
        isVisible ? "opacity-100" : "opacity-0"
      } transition-opacity duration-200`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${
                isValid ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-rose-50 dark:bg-rose-900/30"
              }`}
            >
              {isValid ? (
                <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
              ) : (
                <ShieldX className="text-rose-600 dark:text-rose-400" size={20} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Blockchain Verification
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                View on-chain proof for this record.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div
            className={`rounded-xl border p-4 ${
              isValid
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20"
                : "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20"
            }`}
          >
            <div className="text-xs font-semibold tracking-wide text-gray-600 dark:text-slate-400">
              STATUS
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${
                loading
                  ? "text-gray-700 dark:text-slate-300"
                  : isValid
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-rose-800 dark:text-rose-200"
              }`}
            >
              {loading ? "CHECKING..." : isValid ? "VERIFIED" : "UNVERIFIED"}
            </div>
            {statusReason && (
              <div className="mt-2 text-xs text-gray-700 dark:text-slate-300">{statusReason}</div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-600 dark:text-slate-400">
                    BATCH HASH (DATE KEY)
                  </div>
                  <div className="mt-1 break-all font-mono text-sm text-gray-900 dark:text-slate-100">
                    {loading ? "Loading..." : dateHash}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(dateHash, "dateHash")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  disabled={dateHash === EMPTY_VALUE}
                  title="Copy batch hash"
                >
                  <Copy size={14} />
                  {copiedKey === "dateHash" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-600 dark:text-slate-400">
                    MERKLE ROOT HASH
                  </div>
                  <div className="mt-1 break-all font-mono text-sm text-gray-900 dark:text-slate-100">
                    {loading ? "Loading..." : rootHash}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(rootHash, "rootHash")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  disabled={rootHash === EMPTY_VALUE}
                  title="Copy root hash"
                >
                  <Copy size={14} />
                  {copiedKey === "rootHash" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-600 dark:text-slate-400">
                    TRANSACTION HASH
                  </div>
                  <div className="mt-1 break-all font-mono text-sm text-gray-900 dark:text-slate-100">
                    {loading ? "Loading..." : txHash}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(txHash, "txHash")}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    disabled={txHash === EMPTY_VALUE}
                    title="Copy transaction hash"
                  >
                    <Copy size={14} />
                    {copiedKey === "txHash" ? "Copied" : "Copy"}
                  </button>

                  {txExplorerUrl && (
                    <a
                      href={txExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                      title="View transaction on Etherscan"
                    >
                      <ExternalLink size={14} />
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="text-xs font-semibold tracking-wide text-gray-600 dark:text-slate-400">
                CONTRACT NOTE
              </div>
              <div className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                This contract stores one daily Merkle root per batch/date key.
                Verification checks whether this record's derived hash is consistent with the anchored root.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

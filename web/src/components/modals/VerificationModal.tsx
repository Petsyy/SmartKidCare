import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldX, ExternalLink, Copy, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  data?: {
    isValid: boolean;
    dateHash?: string | null;
    recordedBy?: string | null;
    timestamp?: number | null;
    reason?: string;
  } | null;
};

const EMPTY_VALUE = "-";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const isUsableAddress = (value?: string | null) =>
  Boolean(
    value &&
      value !== EMPTY_VALUE &&
      String(value).toLowerCase() !== ZERO_ADDRESS.toLowerCase(),
  );

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

  const recordedOn = useMemo(() => {
    if (!data?.timestamp) return EMPTY_VALUE;
    return new Date(data.timestamp * 1000).toLocaleString();
  }, [data?.timestamp]);

  const signerWallet = useMemo(
    () => (isUsableAddress(data?.recordedBy) ? String(data?.recordedBy) : null),
    [data?.recordedBy],
  );

  const dateHash = data?.dateHash || EMPTY_VALUE;
  const isValid = !!data?.isValid;

  const etherscanLink = useMemo(() => {
    if (signerWallet) {
      return `https://sepolia.etherscan.io/address/${signerWallet}`;
    }
    return "#";
  }, [signerWallet]);

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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isVisible ? "opacity-100" : "opacity-0"
      } transition-opacity duration-200`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${
                isValid ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              {isValid ? (
                <ShieldCheck className="text-emerald-600" size={20} />
              ) : (
                <ShieldX className="text-rose-600" size={20} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Blockchain Verification
              </h2>
              <p className="text-sm text-gray-500">
                View on-chain proof for this record.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div
            className={`rounded-xl border p-4 ${
              isValid
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="text-xs font-semibold tracking-wide text-gray-600">
              STATUS
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${
                loading
                  ? "text-gray-700"
                  : isValid
                    ? "text-emerald-800"
                    : "text-rose-800"
              }`}
            >
              {loading ? "CHECKING..." : isValid ? "VERIFIED" : "UNVERIFIED"}
            </div>
            {statusReason && (
              <div className="mt-2 text-xs text-gray-700">{statusReason}</div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-600">
                    WALLET (SIGNER)
                  </div>
                  <div className="mt-1 break-all font-mono text-sm text-gray-900">
                    {loading ? "Loading..." : signerWallet || EMPTY_VALUE}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(signerWallet || EMPTY_VALUE, "wallet")
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  disabled={!signerWallet}
                  title="Copy signer wallet"
                >
                  <Copy size={14} />
                  {copiedKey === "wallet" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-600">
                    ON-CHAIN DATA HASH (DATE HASH)
                  </div>
                  <div className="mt-1 break-all font-mono text-sm text-gray-900">
                    {loading ? "Loading..." : dateHash}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(dateHash, "dateHash")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                  disabled={dateHash === EMPTY_VALUE}
                  title="Copy date hash"
                >
                  <Copy size={14} />
                  {copiedKey === "dateHash" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold tracking-wide text-gray-600">
                RECORDED ON-CHAIN
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {loading ? "Loading..." : recordedOn}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <a
            href={etherscanLink}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              etherscanLink === "#"
                ? "pointer-events-none bg-gray-200 text-gray-500"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            <ExternalLink size={16} />
            View on Etherscan
          </a>

          <button
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldX, ExternalLink, Copy, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  data?: {
    isValid: boolean;
    dateHash?: string;
    recordedBy?: string | null; // signer (if your API returns it)
    timestamp?: number | null; // unix seconds
    walletAddress?: string; // fallback signer address
    txHash?: string; // OPTIONAL: if you add this later
    reason?: string; // explanation when unverified/fetch fallback
  } | null;
};

const shorten = (val: string, head = 8, tail = 6) =>
  val.length > head + tail ? `${val.slice(0, head)}…${val.slice(-tail)}` : val;

export default function VerificationModal({ open, onClose, data }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) setIsVisible(true);
    if (!open) setCopiedKey(null);
  }, [open]);

  const recordedOn = useMemo(() => {
    if (!data?.timestamp) return "—";
    return new Date(data.timestamp * 1000).toLocaleString();
  }, [data?.timestamp]);

  const wallet = useMemo(
    () => data?.recordedBy || data?.walletAddress || "—",
    [data?.recordedBy, data?.walletAddress],
  );

  const etherscanLink = useMemo(() => {
    if (!wallet || wallet === "—") return "#";
    // If you later include txHash in API, prefer tx link:
    // return data?.txHash ? `https://sepolia.etherscan.io/tx/${data.txHash}` : `https://sepolia.etherscan.io/address/${wallet}`;
    return `https://sepolia.etherscan.io/address/${wallet}`;
  }, [wallet]);

  const dateHash = data?.dateHash || "—";
  const isValid = !!data?.isValid;

  const copyToClipboard = async (value: string, key: string) => {
    if (!value || value === "—") return;
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
      {/* Overlay (match your admin modals) */}
      <div className="absolute inset-0 bg-gray-400/50" />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Status card */}
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
                isValid ? "text-emerald-800" : "text-rose-800"
              }`}
            >
              {isValid ? "VERIFIED" : "UNVERIFIED"}
            </div>
            {data?.reason && (
              <div className="mt-2 text-xs text-gray-700">
                {data.reason}
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 gap-3">
            {/* Wallet */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-600">
                    WALLET (SIGNER)
                  </div>
                  <div className="mt-1 font-mono text-sm text-gray-900 break-all">
                    {wallet}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(wallet, "wallet")}
                  className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  disabled={wallet === "—"}
                  title="Copy wallet"
                >
                  <Copy size={14} />
                  {copiedKey === "wallet" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Date Hash */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-600">
                    ON-CHAIN DATA HASH (DATE HASH)
                  </div>
                  <div className="mt-1 font-mono text-sm text-gray-900 break-all">
                    {dateHash}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(dateHash, "dateHash")}
                  className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                  disabled={dateHash === "—"}
                  title="Copy hash"
                >
                  <Copy size={14} />
                  {copiedKey === "dateHash" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold tracking-wide text-gray-600">
                RECORDED ON-CHAIN
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {recordedOn}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

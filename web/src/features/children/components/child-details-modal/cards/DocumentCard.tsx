import { FileText, Loader2 } from "lucide-react";
import { VerificationStatus } from "./VerificationStatus";

interface DocumentCardProps {
  label: string;
  description: string;
  isAvailable: boolean;
  isLoading: boolean;
  onOpen: () => void;
  verification?: boolean;
}

export function DocumentCard({
  label,
  description,
  isAvailable,
  isLoading,
  onOpen,
  verification,
}: DocumentCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
            {label}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isAvailable
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300"
          }`}
        >
          {isAvailable ? "Available" : "Not uploaded"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={onOpen}
          disabled={isLoading || !isAvailable}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isLoading ? (
            <Loader2
              size={16}
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <FileText size={16} className="text-teal-600 dark:text-teal-400" />
          )}
          {isAvailable ? `View ${label}` : `${label} unavailable`}
        </button>
        <VerificationStatus
          verified={verification}
          loading={isLoading && isAvailable}
        />
      </div>
    </div>
  );
}


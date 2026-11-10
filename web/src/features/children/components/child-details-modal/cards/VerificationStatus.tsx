import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

interface VerificationStatusProps {
  verified?: boolean;
  loading?: boolean;
}

export function VerificationStatus({
  verified,
  loading = false,
}: VerificationStatusProps) {
  const classes = loading
    ? "border-slate-200/60 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
    : verified === true
      ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : verified === false
        ? "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        : "border-slate-200/60 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300";

  return (
    <p
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm ${classes}`}
    >
      {loading ? (
        <Loader2
          size={14}
          className="animate-spin motion-reduce:animate-none"
        />
      ) : verified === true ? (
        <ShieldCheck size={14} />
      ) : (
        <ShieldAlert size={14} />
      )}
      {loading
        ? "Checking blockchain"
        : verified === true
          ? "Blockchain verified"
          : verified === false
            ? "Not verified"
            : "Not checked"}
    </p>
  );
}


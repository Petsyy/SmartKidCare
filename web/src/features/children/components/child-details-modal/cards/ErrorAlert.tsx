import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  tone: "danger" | "warning";
  title: string;
  message: string;
}

export function ErrorAlert({ tone, title, message }: ErrorAlertProps) {
  const toneClasses =
    tone === "danger"
      ? "border-rose-200/70 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
      : "border-amber-200/70 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";

  const iconClasses =
    tone === "danger"
      ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
      : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClasses}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${iconClasses}`}>
          <AlertCircle size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm/6 opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}


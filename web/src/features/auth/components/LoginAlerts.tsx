import { AlertCircle } from "lucide-react";

export interface LoginAlertsProps {
  error: string | null;
  info: string | null;
}

export function LoginAlerts({ error, info }: LoginAlertsProps) {
  return (
    <>
      {error && (
        <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10">
          <AlertCircle
            className="shrink-0 text-red-600 dark:text-red-300"
            size={20}
          />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {info && (
        <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-500/40 dark:bg-teal-500/10">
          <p className="text-sm text-teal-700 dark:text-teal-300">{info}</p>
        </div>
      )}
    </>
  );
}

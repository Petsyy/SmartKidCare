import type { ReactNode } from "react";

interface InfoCardProps {
  label: string;
  value: ReactNode;
  subvalue?: ReactNode;
}

export function InfoCard({ label, value, subvalue }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <div className="text-[15px] font-medium leading-6 text-slate-800 dark:text-slate-200">
        {value}
      </div>
      {subvalue ? (
        <div className="mt-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
          {subvalue}
        </div>
      ) : null}
    </div>
  );
}


import { Clock, RefreshCw, Download, Printer } from "lucide-react";
import type { ReportDatePreset } from "@/features/reports/hooks/useReportAnalytics";

const PRESET_OPTIONS: Array<{ value: ReportDatePreset; label: string }> = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

type ReportsFiltersProps = {
  datePreset: ReportDatePreset;
  setDatePreset: (val: ReportDatePreset) => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  customRangeError: string | null;
  activeRange: { label: string; isValid: boolean };
  lastUpdatedLabel: string;
  hasData: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onPrint: () => void;
};

export const ReportsFilters = ({
  datePreset,
  setDatePreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  customRangeError,
  activeRange,
  lastUpdatedLabel,
  hasData,
  onRefresh,
  onExport,
  onPrint,
}: ReportsFiltersProps) => {
  return (
    <div className="no-print rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
            Report Range
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {activeRange.label}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            Last refreshed: {lastUpdatedLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_OPTIONS.map((option) => {
            const isActive = datePreset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDatePreset(option.value)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200"
                    : "border-gray-300 bg-white text-gray-600 hover:border-teal-200 hover:text-teal-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {datePreset === "custom" && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Start Date
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              End Date
            </span>
            <input
              type="date"
              value={customEndDate}
              onChange={(event) => setCustomEndDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            />
          </label>
        </div>
      )}

      {customRangeError && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          {customRangeError}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={!hasData || !activeRange.isValid}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={!hasData || !activeRange.isValid}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </button>
      </div>
    </div>
  );
};

import { Download, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useNutritionAnalytics } from "../hooks/useNutritionAnalytics";
import { downloadCsvFile, todayFileKey } from "../utils/csv-export";
import { buildNutritionCsvRows } from "../utils/report-csv-builders";

const PERIODS = [
  { key: "initial", label: "Initial", color: "#3b82f6" },
  { key: "quarterly", label: "Quarterly", color: "#a855f7" },
  { key: "final", label: "Final", color: "#0d9488" },
] as const;

const COMPARISONS = [
  {
    key: "initialToQuarterly",
    label: "Initial → Quarterly",
    from: "initial",
    to: "quarterly",
  },
  {
    key: "quarterlyToFinal",
    label: "Quarterly → Final",
    from: "quarterly",
    to: "final",
  },
  {
    key: "initialToFinal",
    label: "Initial → Final",
    from: "initial",
    to: "final",
  },
] as const;

const assessmentLabel = (period: "initial" | "quarterly" | "final") =>
  period.charAt(0).toUpperCase() + period.slice(1);

export function NutritionAnalytics({ showActions = true }: { showActions?: boolean }) {
  const { data, isLoading, isFetching, error, refetch, schoolYear } =
    useNutritionAnalytics();

  const selectedSchoolYear = schoolYear || data?.filters.schoolYear || "all";
  const hasData = (data?.totalSubmitted ?? 0) > 0;
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Unable to load nutrition analytics."
        : null;

  const statusData = [
    {
      name: "Severely Underweight",
      initial: data?.periods.initial.severelyUnderweightCount ?? 0,
      quarterly: data?.periods.quarterly.severelyUnderweightCount ?? 0,
      final: data?.periods.final.severelyUnderweightCount ?? 0,
    },
    {
      name: "Underweight",
      initial: data?.periods.initial.underweightCount ?? 0,
      quarterly: data?.periods.quarterly.underweightCount ?? 0,
      final: data?.periods.final.underweightCount ?? 0,
    },
    {
      name: "Normal",
      initial: data?.periods.initial.normalCount ?? 0,
      quarterly: data?.periods.quarterly.normalCount ?? 0,
      final: data?.periods.final.normalCount ?? 0,
    },
    {
      name: "Overweight",
      initial: data?.periods.initial.overweightCount ?? 0,
      quarterly: data?.periods.quarterly.overweightCount ?? 0,
      final: data?.periods.final.overweightCount ?? 0,
    },
    {
      name: "Obese",
      initial: data?.periods.initial.obeseCount ?? 0,
      quarterly: data?.periods.quarterly.obeseCount ?? 0,
      final: data?.periods.final.obeseCount ?? 0,
    },
  ];

  const displayYear =
    selectedSchoolYear !== "all"
      ? selectedSchoolYear
      : data?.filters.schoolYear ?? "";

  const downloadCsv = () => {
    if (!data) return;
    downloadCsvFile(
      `smartkidcare-nutrition-${displayYear || "latest"}-${todayFileKey()}.csv`,
      buildNutritionCsvRows(data, new Date().toLocaleString("en-PH")),
    );
  };

  return (
    <section className="space-y-4" aria-labelledby="nutrition-analytics-title">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2
                id="nutrition-analytics-title"
                className="text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                Nutritional Progress Analytics
              </h2>
              {displayYear && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {displayYear}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              View submitted assessments immediately and compare progress across initial, quarterly, and final periods.
            </p>
          </div>
          {showActions && <div className="no-print flex flex-wrap items-end gap-2">
            <Button
              onClick={() => void refetch()}
              disabled={isFetching}
              icon={
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              }
            >
              Refresh
            </Button>
            <Button
              onClick={downloadCsv}
              disabled={!hasData}
              icon={<Download className="h-4 w-4" />}
            >
              Export CSV
            </Button>
          </div>}
        </div>

        {errorMessage && (
          <div className="mt-4">
            <ErrorAlert message={errorMessage} />
          </div>
        )}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
            Loading nutrition analytics...
          </div>
        ) : !hasData ? (
          <div className="mt-5 flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 text-center dark:border-slate-700">
            <p className="font-medium text-gray-700 dark:text-slate-200">
              No submitted nutrition assessments found.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Choose another school year or submit an initial, quarterly, or final assessment.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  Progress Overview
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Student evaluation and improvement metrics.
                </p>
              </div>
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {PERIODS.map((period) => (
                  <div key={period.key} className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <p className="text-sm text-gray-500 dark:text-slate-400">{period.label} assessments</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: period.color }}>
                      {data?.periods[period.key].submittedCount ?? 0}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {COMPARISONS.map((comparison) => {
                  const summary = data?.comparisons[comparison.key];
                  const isAvailable = (summary?.totalEvaluated ?? 0) > 0;
                  const fromCount = data?.periods[comparison.from].submittedCount ?? 0;
                  const toCount = data?.periods[comparison.to].submittedCount ?? 0;
                  const fromLabel = assessmentLabel(comparison.from);
                  const toLabel = assessmentLabel(comparison.to);
                  const unavailableMessage =
                    fromCount === 0 && toCount === 0
                      ? `No ${fromLabel} or ${toLabel} assessments have been submitted yet.`
                      : fromCount === 0
                        ? `Submit ${fromLabel} assessments for the same students to calculate this comparison.`
                        : toCount === 0
                          ? `Submit ${toLabel} assessments for the same students to calculate this comparison.`
                          : `${fromLabel} and ${toLabel} assessments exist, but none match the same student and school year.`;
                  return (
                    <div key={comparison.key} className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                      <h4 className="font-semibold text-gray-900 dark:text-slate-100">{comparison.label}</h4>
                      {isAvailable && summary ? (
                        <>
                          <p className="mt-3 text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {summary.improvementRate.toFixed(1)}%
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                            {summary.improvedToNormal} of {summary.initiallyMalnourished} malnourished students improved
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                            {summary.totalEvaluated} students compared
                          </p>
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                          {unavailableMessage}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-slate-700">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  Current Status Distribution
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Submitted students at each status level, grouped by assessment period.
                </p>
              </div>
              <div className="-mx-2 overflow-x-auto px-2" role="img" aria-label="Nutritional status distribution by assessment period">
                <div className="min-w-[620px]">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={statusData}
                    barCategoryGap="22%"
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      formatter={(value?: number | string) => [Number(value ?? 0), "Students"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                      }}
                    />
                    <Legend />
                    {PERIODS.map((period) => (
                      <Bar
                        key={period.key}
                        dataKey={period.key}
                        name={period.label}
                        fill={period.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={34}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

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
import { useCompetencyAnalytics } from "../hooks/useCompetencyAnalytics";
import { downloadCsvFile, todayFileKey } from "../utils/csv-export";
import { buildCompetencyCsvRows } from "../utils/report-csv-builders";

export function CompetencyAnalytics({ showActions = true }: { showActions?: boolean }) {
  const {
    data,
    isLoading,
    isFetching,
    errorMessage,
    refetch,
    schoolYear,

  } = useCompetencyAnalytics();

  const quarterlyCount = data?.periods.quarterly.totalStudents ?? 0;
  const finalCount = data?.periods.final.totalStudents ?? 0;
  const hasData = quarterlyCount + finalCount > 0;
  const quarterlyCompetencies = data?.periods.quarterly.competencies ?? [];
  const finalCompetencies = data?.periods.final.competencies ?? [];
  const finalByCompetency = new Map(
    finalCompetencies.map((item) => [item.competencyId, item]),
  );
  const competencyIds = new Set([
    ...quarterlyCompetencies.map((item) => item.competencyId),
    ...finalCompetencies.map((item) => item.competencyId),
  ]);
  const competencies = Array.from(competencyIds).map((competencyId) => {
    const quarterly = quarterlyCompetencies.find(
      (item) => item.competencyId === competencyId,
    );
    const final = finalByCompetency.get(competencyId);
    const identity = quarterly || final!;
    return {
      competencyId,
      name: identity.name,
      category: identity.category,
      quarterly,
      final,
    };
  });
  const totalForLevel = (
    period: typeof quarterlyCompetencies,
    level: "achieved" | "developing" | "emerging" | "not_demonstrated",
  ) => period.reduce((total, item) => total + item.distribution[level], 0);
  const ratingData = [
    {
      name: "Achieved",
      quarterly: totalForLevel(quarterlyCompetencies, "achieved"),
      final: totalForLevel(finalCompetencies, "achieved"),
    },
    {
      name: "Developing",
      quarterly: totalForLevel(quarterlyCompetencies, "developing"),
      final: totalForLevel(finalCompetencies, "developing"),
    },
    {
      name: "Emerging",
      quarterly: totalForLevel(quarterlyCompetencies, "emerging"),
      final: totalForLevel(finalCompetencies, "emerging"),
    },
    {
      name: "Not Yet",
      quarterly: totalForLevel(quarterlyCompetencies, "not_demonstrated"),
      final: totalForLevel(finalCompetencies, "not_demonstrated"),
    },
  ];

  const displayYear =
    schoolYear !== "all"
      ? schoolYear
      : data?.filters.schoolYear && data?.filters.schoolYear !== "all"
        ? data.filters.schoolYear
        : data?.schoolYears?.[0] ?? "";

  const downloadCsv = () => {
    if (!data) return;
    downloadCsvFile(
      `smartkidcare-competencies-${schoolYear}-${todayFileKey()}.csv`,
      buildCompetencyCsvRows(data, new Date().toLocaleString("en-PH")),
    );
  };

  return (
    <section className="space-y-4" aria-labelledby="competency-analytics-title">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2
                id="competency-analytics-title"
                className="text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                Student Competency Analytics
              </h2>
              {displayYear && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {displayYear}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Compare Quarterly and Final competency results together for the selected school year.
            </p>
          </div>
          {showActions && <div className="no-print flex flex-wrap items-end gap-2">
            <Button
              onClick={() => void refetch()}
              disabled={isFetching}
              icon={<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />}
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

        {errorMessage && <div className="mt-4"><ErrorAlert message={errorMessage} /></div>}

        {isLoading ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
            Loading competency analytics...
          </div>
        ) : !hasData ? (
          <div className="mt-5 flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 text-center dark:border-slate-700">
            <p className="font-medium text-gray-700 dark:text-slate-200">
              No submitted competency evaluations found.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Try another school year or submit a Quarterly or Final teacher evaluation.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["quarterly", "final"] as const).map((period) => {
                const count = data?.periods[period].totalStudents ?? 0;
                return (
                  <div
                    key={period}
                    className="inline-flex min-h-11 items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className="text-sm font-medium capitalize text-gray-600 dark:text-slate-300">{period}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-slate-50">{count}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">evaluations</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">Quarterly → Final progress</h3>
              {(data?.comparison.matchedStudents ?? 0) > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <ComparisonMetric label="Students matched" value={data?.comparison.matchedStudents ?? 0} />
                  <ComparisonMetric label="Ratings improved" value={data?.comparison.improvedRatings ?? 0} valueClassName="text-emerald-600 dark:text-emerald-400" />
                  <ComparisonMetric label="Ratings unchanged" value={data?.comparison.unchangedRatings ?? 0} valueClassName="text-blue-600 dark:text-blue-400" />
                  <ComparisonMetric label="Ratings declined" value={data?.comparison.declinedRatings ?? 0} valueClassName="text-rose-600 dark:text-rose-400" />
                  <ComparisonMetric label="Improvement rate" value={`${(data?.comparison.improvementRate ?? 0).toFixed(1)}%`} />
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                  {quarterlyCount === 0 && finalCount === 0
                    ? "No Quarterly or Final evaluations have been submitted yet."
                    : quarterlyCount === 0
                      ? "Submit Quarterly evaluations for the same students to calculate progress."
                      : finalCount === 0
                        ? "Submit Final evaluations for the same students to calculate progress."
                        : "Quarterly and Final evaluations exist, but none match the same student and school year."}
                </p>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  Quarterly and Final competency rating distribution
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Rating totals grouped by Quarterly and Final assessment periods.
                </p>
              </div>
              <div className="overflow-x-auto" role="img" aria-label="Quarterly and Final totals by competency rating level">
                <div className="min-w-[620px]">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={ratingData}
                    barCategoryGap="22%"
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
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
                      formatter={(value?: number | string, name?: string) => [
                        Number(value ?? 0),
                        name ?? "Students",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="quarterly"
                      name="Quarterly"
                      fill="#a855f7"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={42}
                    />
                    <Bar
                      dataKey="final"
                      name="Final"
                      fill="#0d9488"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {hasData && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-[1080px] w-full divide-y divide-gray-200 text-sm dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th rowSpan={2} scope="col" className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-slate-300">Competency</th>
                <th colSpan={5} scope="colgroup" className="border-l border-gray-200 px-4 py-3 text-center font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200">Quarterly</th>
                <th colSpan={5} scope="colgroup" className="border-l border-gray-200 px-4 py-3 text-center font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200">Final</th>
              </tr>
              <tr>
                {["Achieved", "Developing", "Emerging", "Not Yet", "Rate", "Achieved", "Developing", "Emerging", "Not Yet", "Rate"].map((heading, index) => (
                  <th key={`${heading}-${index}`} scope="col" className={`${index === 0 || index === 5 ? "border-l border-gray-200 dark:border-slate-700" : ""} whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-slate-300`}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {competencies.map((item) => (
                <tr key={item.competencyId}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-gray-900 dark:text-slate-100">
                    {item.name}
                    <span className="block text-xs font-normal text-gray-500 dark:text-slate-400">{item.category}</span>
                  </th>
                  <PeriodCells item={item.quarterly} first />
                  <PeriodCells item={item.final} first />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ComparisonMetric({
  label,
  value,
  valueClassName = "text-gray-900 dark:text-slate-50",
}: {
  label: string;
  value: number | string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-h-20 flex-col justify-between rounded-lg bg-white p-3 dark:bg-slate-900">
      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function PeriodCells({
  item,
  first,
}: {
  item:
    | {
        distribution: {
          achieved: number;
          developing: number;
          emerging: number;
          not_demonstrated: number;
        };
        achievedRate: number;
      }
    | undefined;
  first?: boolean;
}) {
  const values = item
    ? [
        item.distribution.achieved,
        item.distribution.developing,
        item.distribution.emerging,
        item.distribution.not_demonstrated,
      ]
    : [0, 0, 0, 0];
  return (
    <>
      {values.map((value, index) => (
        <td
          key={index}
          className={`${first && index === 0 ? "border-l border-gray-200 dark:border-slate-700" : ""} px-3 py-3`}
        >
          {value}
        </td>
      ))}
      <td className="px-3 py-3 font-semibold text-teal-700 dark:text-teal-300">
        {item ? `${item.achievedRate}%` : "—"}
      </td>
    </>
  );
}

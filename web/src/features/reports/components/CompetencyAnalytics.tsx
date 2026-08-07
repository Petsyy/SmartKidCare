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
import { SelectFilter } from "@/components/ui/SelectFilter";
import { useCompetencyAnalytics } from "../hooks/useCompetencyAnalytics";


const PERIOD_OPTIONS = [
  { value: "all", label: "Latest period" },
  { value: "initial", label: "Initial" },
  { value: "midyear", label: "Midyear" },
  { value: "final", label: "Final" },
];

const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

export function CompetencyAnalytics() {
  const {
    data,
    isLoading,
    isFetching,
    errorMessage,
    refetch,
    period,
    setPeriod,
    schoolYear,
    setSchoolYear,
  } = useCompetencyAnalytics();

  const competencies = data?.competencies ?? [];
  const hasData = (data?.totalStudents ?? 0) > 0;

  const downloadCsv = () => {
    if (!data) return;
    const rows = [
      ["Competency", "Category", "Achieved", "Developing", "Emerging", "Not Yet", "Total Evaluated", "Achieved Rate"],
      ...data.competencies.map((item) => [
        item.name,
        item.category,
        item.distribution.achieved,
        item.distribution.developing,
        item.distribution.emerging,
        item.distribution.not_demonstrated,
        item.totalEvaluated,
        `${item.achievedRate}%`,
      ]),
    ];
    const blob = new Blob(
      [rows.map((row) => row.map(csvCell).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `smartkidcare-competencies-${schoolYear}-${period}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4" aria-labelledby="competency-analytics-title">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2
              id="competency-analytics-title"
              className="text-xl font-semibold text-gray-900 dark:text-slate-50"
            >
              Student Competency Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Overall rating distribution from submitted evaluations. Drafts are excluded.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                School year
              </span>
              <SelectFilter
                value={schoolYear}
                onChange={setSchoolYear}
                options={[
                  { value: "all", label: "All school years" },
                  ...(data?.schoolYears ?? []).map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Period
              </span>
              <SelectFilter
                value={period}
                onChange={(value) =>
                  setPeriod(value as "all" | "initial" | "midyear" | "final")
                }
                options={PERIOD_OPTIONS}
              />
            </label>
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
          </div>
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
              Try another school year or period, or submit a teacher evaluation first.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-gray-100 py-3 text-sm dark:border-slate-800">
              <p className="text-gray-600 dark:text-slate-400">
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                  {data?.totalStudents ?? 0}
                </span>{" "}
                students evaluated
              </p>
              <p className="text-gray-600 dark:text-slate-400">
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                  {competencies.length}
                </span>{" "}
                competencies tracked
              </p>
            </div>

            <div className="mt-5">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  Competency rating distribution
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Number of evaluated students at each rating level.
                </p>
              </div>
              <div role="img" aria-label="Student rating distribution by competency">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={competencies}
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
                      dataKey="distribution.achieved"
                      name="Achieved"
                      fill="#0d9488"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="distribution.developing"
                      name="Developing"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="distribution.emerging"
                      name="Emerging"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="distribution.not_demonstrated"
                      name="Not Yet"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {hasData && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {["Competency", "Achieved", "Developing", "Emerging", "Not Yet", "Achieved Rate"].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-slate-300">
                    {heading}
                  </th>
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
                  <td className="px-4 py-3">{item.distribution.achieved}</td>
                  <td className="px-4 py-3">{item.distribution.developing}</td>
                  <td className="px-4 py-3">{item.distribution.emerging}</td>
                  <td className="px-4 py-3">{item.distribution.not_demonstrated}</td>
                  <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{item.achievedRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
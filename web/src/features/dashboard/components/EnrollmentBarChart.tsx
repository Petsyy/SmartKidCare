import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EnrollmentDataPoint } from "../hooks/useAdminDashboard";

type EnrollmentBarChartProps = {
  data: EnrollmentDataPoint[];
};

const PROGRAM_LABELS = {
  regular: "Regular Enrollee",
  fourPs: "4Ps Beneficiary",
} as const;

const PROGRAM_SERIES = [
  { label: PROGRAM_LABELS.regular, color: "#6366f1" },
  { label: PROGRAM_LABELS.fourPs, color: "#f59e0b" },
] as const;

export function EnrollmentBarChart({ data }: EnrollmentBarChartProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Enrollment and Gender Overview
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Number of enrolled children by program and gender
        </p>
      </div>

      <div
        className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"
        aria-label="Chart legend: Regular Enrollee, then 4Ps Beneficiary"
      >
        {PROGRAM_SERIES.map((series) => (
          <span
            key={series.label}
            className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300"
          >
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: series.color }}
              aria-hidden="true"
            />
            {series.label}
          </span>
        ))}
      </div>

      <div
        className="min-h-[260px] w-full flex-1"
        role="img"
        aria-label="Grouped bar graph showing Regular Enrollee and 4Ps Beneficiary totals for boys and girls"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 24, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              width={44}
            />
            <Tooltip
              cursor={{ fill: "#f1f5f9", opacity: 0.65 }}
              content={({ active, payload, label }) => {
                const entry = payload?.[0]?.payload as
                  | EnrollmentDataPoint
                  | undefined;

                if (!active || !entry) return null;

                return (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-1 font-semibold text-gray-900 dark:text-slate-100">
                      {label}
                    </p>
                    <p className="text-indigo-600 dark:text-indigo-400">
                      {PROGRAM_LABELS.regular}: {entry.regular}
                    </p>
                    <p className="text-amber-600 dark:text-amber-400">
                      {PROGRAM_LABELS.fourPs}: {entry.fourPs}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="regular"
              name={PROGRAM_LABELS.regular}
              fill="#6366f1"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey="regular"
                position="top"
                fill="#334155"
                fontSize={13}
                fontWeight={600}
              />
            </Bar>
            <Bar
              dataKey="fourPs"
              name={PROGRAM_LABELS.fourPs}
              fill="#f59e0b"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey="fourPs"
                position="top"
                fill="#334155"
                fontSize={13}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {data.map((entry) => (
          <div
            key={entry.name}
            className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60"
          >
            <p className="mb-2 font-semibold text-gray-900 dark:text-slate-100">
              {entry.name}
            </p>
            <dl className="space-y-1.5 text-gray-600 dark:text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm bg-indigo-500"
                    aria-hidden="true"
                  />
                  {PROGRAM_LABELS.regular}
                </dt>
                <dd className="shrink-0 font-semibold text-gray-900 dark:text-slate-100">
                  {entry.regular}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm bg-amber-500"
                    aria-hidden="true"
                  />
                  {PROGRAM_LABELS.fourPs}
                </dt>
                <dd className="shrink-0 font-semibold text-gray-900 dark:text-slate-100">
                  {entry.fourPs}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

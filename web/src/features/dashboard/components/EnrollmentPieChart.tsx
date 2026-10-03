import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PieDataPoint } from "../hooks/useAdminDashboard";

type EnrollmentPieChartProps = {
  data: PieDataPoint[];
};

export function EnrollmentPieChart({ data }: EnrollmentPieChartProps) {
  return (
    <div className="self-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Bonuan Sabangan Enrollment Overview
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Distribution of the center's child development metrics
        </p>
      </div>

      <div className="h-48 w-full sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius="75%"
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-gray-600 dark:text-slate-300">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

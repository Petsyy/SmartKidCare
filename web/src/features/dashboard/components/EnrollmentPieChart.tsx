import {PieChart,Pie,Cell,Tooltip,Legend,ResponsiveContainer} from "recharts";
import type { PieDataPoint } from "../hooks/useAdminDashboard";

type EnrollmentPieChartProps = {
  data: PieDataPoint[];
};

export function EnrollmentPieChart({ data }: EnrollmentPieChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Center And Enrollment Overview
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Distribution of your main child development metrics
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
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

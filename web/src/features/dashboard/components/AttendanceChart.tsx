import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from "recharts";
import type { ChartDataPoint } from "../hooks/useAdminDashboard";

type AttendanceChartProps = {
  data: ChartDataPoint[];
};

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Weekly Attendance &amp; Feeding Trend
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Attendance and feeding rates for the past 7 days
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-teal-500"></div>
            <span className="text-gray-600 dark:text-slate-300">
              Attendance Rate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-600 dark:text-slate-300">
              Feeding Rate
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
            formatter={(value: number | string | undefined) => [
              `${value ?? 0}%`,
              "Rate",
            ]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#14b8a6"
            strokeWidth={3}
            name="Attendance Rate"
            dot={{ fill: "#14b8a6", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="feeding"
            stroke="#10b981"
            strokeWidth={3}
            name="Feeding Rate"
            dot={{ fill: "#10b981", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

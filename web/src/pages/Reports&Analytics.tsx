import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Calendar,
  Utensils,
  AlertCircle,
  BarChart3,
  Download,
  RefreshCw,
  Clock,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import {
  useReportAnalytics,
  type ReportDatePreset,
} from "@/hooks/useReportAnalytics";

const PRESET_OPTIONS: Array<{ value: ReportDatePreset; label: string }> = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PH");

const formatNumber = (value: number) => NUMBER_FORMATTER.format(value);

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: "blue" | "teal" | "emerald" | "rose" | "slate";
}) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    teal: "bg-teal-50 text-teal-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default function ReportAnalytics() {
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    customRangeError,
    activeRange,
    lastUpdatedLabel,
    summary,
    dailyTrends,
    recentDailyRows,
    topExceptions,
    statusDistribution,
    hasData,
    fetchReportData,
    downloadCsv,
  } = useReportAnalytics();

  const hasRealStatusData = statusDistribution.some(
    (item) => item.name !== "No Data",
  );

  return (
    <Layout
      activeItem="reports"
      breadcrumbs={["Admin", "Reports & Analytics"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500">
            Performance reports for attendance, feeding, and exception trends.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Report Range
              </p>
              <p className="text-sm text-gray-600">{activeRange.label}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
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
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-teal-300 bg-teal-100 text-teal-800"
                        : "border-gray-300 bg-white text-gray-600 hover:border-teal-200 hover:text-teal-700"
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
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Start Date
                </span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  End Date
                </span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
            </div>
          )}

          {customRangeError && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {customRangeError}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchReportData()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!hasData || !activeRange.isValid}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-56 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500 shadow-sm">
            Loading report analytics...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Active Students"
                value={formatNumber(summary.activeChildren)}
                subtitle={`${formatNumber(summary.totalChildren)} enrolled`}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Teacher Accounts"
                value={formatNumber(summary.totalTeachers)}
                subtitle="Total teaching staff"
                icon={BarChart3}
                color="slate"
              />
              <StatCard
                title="Attendance Rate"
                value={`${summary.attendanceRate}%`}
                subtitle={`${formatNumber(summary.attendanceRecords)} attendance checks`}
                icon={Calendar}
                color="teal"
              />
              <StatCard
                title="Feeding Compliance"
                value={`${summary.feedingRate}%`}
                subtitle={`${formatNumber(summary.feedingRecords)} feeding checks`}
                icon={Utensils}
                color="emerald"
              />
              <StatCard
                title="Exception Rate"
                value={`${summary.exceptionRate}%`}
                subtitle={`${formatNumber(summary.absentCount + summary.missedCount)} exceptions`}
                icon={AlertCircle}
                color="rose"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Daily Compliance Trend
                  </h3>
                  <p className="text-sm text-gray-500">
                    Attendance and feeding compliance rates by day.
                  </p>
                </div>
                {dailyTrends.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                    No trend data for the selected range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
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
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Line
                        type="monotone"
                        dataKey="attendanceRate"
                        stroke="#14b8a6"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="Attendance Rate"
                      />
                      <Line
                        type="monotone"
                        dataKey="feedingRate"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="Feeding Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Daily Outcomes
                  </h3>
                  <p className="text-sm text-gray-500">
                    Present, absent, fed, and missed counts by day.
                  </p>
                </div>
                {dailyTrends.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                    No outcome data for the selected range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="present" fill="#10b981" name="Present" />
                      <Bar dataKey="absent" fill="#f43f5e" name="Absent" />
                      <Bar dataKey="completed" fill="#14b8a6" name="Fed" />
                      <Bar dataKey="missed" fill="#f59e0b" name="Missed Meal" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Status Distribution
                  </h3>
                  <p className="text-sm text-gray-500">
                    Combined distribution of attendance and feeding statuses.
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      labelLine={false}
                      label={
                        hasRealStatusData
                          ? (entry) => `${entry.name}: ${entry.value}`
                          : false
                      }
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    {hasRealStatusData && <Legend />}
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Exceptions by Child
                  </h3>
                  <p className="text-sm text-gray-500">
                    Children with the highest combined absences and missed
                    meals.
                  </p>
                </div>
                {topExceptions.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                    No exception records in this range.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Child
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Absences
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Missed Meals
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topExceptions.map((row) => (
                          <tr key={row.childId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {row.childName}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {formatNumber(row.absentCount)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {formatNumber(row.missedCount)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-rose-700">
                              {formatNumber(row.totalExceptions)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Daily Summary
                </h3>
                <p className="text-sm text-gray-500">
                  Snapshot of the latest days in the selected range.
                </p>
              </div>
              {recentDailyRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No daily summaries available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Attendance Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Feeding Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Present / Absent
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Fed / Missed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentDailyRows.map((row) => (
                        <tr key={row.dateKey} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {new Intl.DateTimeFormat("en-PH", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              timeZone: "Asia/Manila",
                            }).format(new Date(row.dateKey))}
                          </td>
                          <td className="px-4 py-3 text-right text-teal-700">
                            {row.attendanceRate}%
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-700">
                            {row.feedingRate}%
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatNumber(row.present)} /{" "}
                            {formatNumber(row.absent)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatNumber(row.completed)} /{" "}
                            {formatNumber(row.missed)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

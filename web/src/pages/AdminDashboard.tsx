import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Calendar, Utensils, AlertCircle, Clock } from "lucide-react";
import Layout from "../components/layout/Layout";
import { useAdminDashboard } from "../hooks/useAdminDashboard";

const formatDateKey = (key: string) => {
  if (!key) return "";
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return key;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(year, month - 1, day));
};

const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: { value: string; isUp: boolean };
  icon: any;
  color: "blue" | "teal" | "purple" | "rose";
}) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    teal: "bg-teal-50 text-teal-600",
    purple: "bg-purple-50 text-purple-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${trend.isUp ? "text-emerald-600" : "text-rose-600"}`}
              >
                {trend.value}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { stats, chartData, pieData, recentActivities, isLoading, dateMeta } =
    useAdminDashboard();

  return (
    <Layout
      activeItem="dashboard"
      breadcrumbs={["Admin", "Dashboard"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome to Smart KidCare Monitoring System
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-gray-500">
              Loading dashboard...
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Enrollment"
                value={String(stats.totalChildren)}
                subtitle={`${stats.activeChildren} active students`}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Today's Attendance Rate"
                value={`${stats.todayAttendanceRate}%`}
                subtitle={
                  dateMeta.attendanceKey &&
                  dateMeta.attendanceKey !== dateMeta.todayKey
                    ? `Present on ${formatDateKey(dateMeta.attendanceKey)}`
                    : "Present today"
                }
                trend={{ value: "↑ 2%", isUp: true }}
                icon={Calendar}
                color="teal"
              />
              <StatCard
                title="Lunch Feeding Compliance"
                value={`${stats.todayFeedingRate}%`}
                subtitle={
                  dateMeta.feedingKey &&
                  dateMeta.feedingKey !== dateMeta.todayKey
                    ? `Children fed on ${formatDateKey(dateMeta.feedingKey)}`
                    : "Children fed"
                }
                trend={{
                  value: stats.todayFeedingRate >= 70 ? "↑ 3%" : "↓ 3%",
                  isUp: stats.todayFeedingRate >= 70,
                }}
                icon={Utensils}
                color="purple"
              />
              <StatCard
                title="System Alerts"
                value={String(stats.todayExceptions)}
                subtitle="Requires attention"
                icon={AlertCircle}
                color="rose"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Weekly Attendance Trend
                    </h3>
                    <p className="text-sm text-gray-500">
                      Attendance rate vs target for the past 7 days
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-teal-500"></div>
                      <span className="text-gray-600">Attendance Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-600">Target</span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
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
                      formatter={(value: any) => [`${value}%`, ""]}
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
                      dataKey="target"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                      dot={{ fill: "#10b981", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Today's Attendance Status
                  </h3>
                  <p className="text-sm text-gray-500">
                    {dateMeta.attendanceKey &&
                    dateMeta.attendanceKey !== dateMeta.todayKey
                      ? `No records for today. Showing latest from ${formatDateKey(
                          dateMeta.attendanceKey,
                        )}`
                      : "Distribution of present vs absent students"}
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-600">
                      Present: {pieData[0]?.value || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                    <span className="text-gray-600">
                      Absent: {pieData[1]?.value || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Activity
                  </h3>
                  <p className="text-sm text-gray-500">
                    Latest attendance and feeding records
                  </p>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No recent activity
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Child Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                  activity.type === "attendance"
                                    ? "bg-emerald-100"
                                    : "bg-emerald-100"
                                }`}
                              >
                                {activity.type === "attendance" ? (
                                  <Calendar className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Utensils className="h-4 w-4 text-emerald-600" />
                                )}
                              </div>
                              <span className="text-sm capitalize text-gray-900">
                                {activity.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {activity.childName}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {activity.action}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {activity.timestamp}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                activity.status === "present" ||
                                activity.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {activity.status}
                            </span>
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

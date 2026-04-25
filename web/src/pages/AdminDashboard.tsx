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
import { Home, Users, UserCircle, Heart, Smile, Clock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { stats, chartData, pieData, recentActivities, isLoading } =
    useAdminDashboard();

  return (
    <Layout
      activeItem="dashboard"
      breadcrumbs={["Admin", "Dashboard"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Welcome to Smart KidCare Monitoring System
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-gray-500 dark:text-slate-400">
              Loading dashboard...
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <AdminStatCard
                title="Total Child Development Centers"
                value={String(stats.totalChildDevelopmentCenters)}
                subtitle="Active centers"
                icon={Home}
                color="blue"
              />
              <AdminStatCard
                title="Child Development Workers"
                value={String(stats.childDevelopmentWorkers)}
                subtitle="Active teacher accounts"
                icon={Users}
                color="teal"
              />
              <AdminStatCard
                title="Total Enrolled Children"
                value={String(stats.totalEnrolledDaycares)}
                subtitle="Total enrolled children"
                icon={UserCircle}
                color="purple"
              />
              <AdminStatCard
                title="4P's Beneficiaries"
                value={String(stats.fourPsBeneficiaries)}
                subtitle="Children under 4Ps program"
                icon={Heart}
                color="rose"
              />
              <AdminStatCard
                title="Regular Attendees"
                value={String(stats.regularAttendees)}
                subtitle="Non-beneficiary enrollees"
                icon={Smile}
                color="blue"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      Weekly Attendance & Feeding Trend
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Attendance and feeding rates for the past 7 days
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-teal-500"></div>
                      <span className="text-gray-600 dark:text-slate-300">Attendance Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-600 dark:text-slate-300">Feeding Rate</span>
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
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
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

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {pieData.map((entry) => (
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
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Recent Activity
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Latest attendance and feeding records
                  </p>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-slate-400">
                  No recent activity
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                          Child Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                      {recentActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
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
                                  <Users className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-emerald-600" />
                                )}
                              </div>
                              <span className="text-sm capitalize text-gray-900 dark:text-slate-100">
                                {activity.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {activity.childName}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-slate-300">
                              {activity.action}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-slate-400">
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

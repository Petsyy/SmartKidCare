import { useCallback, useEffect, useState } from "react";
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
import { API_BASE } from "../components/config/config.api";

type DashboardStats = {
  totalChildren: number;
  activeChildren: number;
  totalTeachers: number;
  todayAttendanceRate: number;
  todayFeedingRate: number;
  todayExceptions: number;
};

type ChartDataPoint = {
  day: string;
  attendance: number;
  target: number;
};

type PieDataPoint = {
  name: string;
  value: number;
  color: string;
};

type RecentActivity = {
  id: string;
  type: "attendance" | "feeding";
  childName: string;
  action: string;
  timestamp: string;
  status: string;
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

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
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    activeChildren: 0,
    totalTeachers: 0,
    todayAttendanceRate: 0,
    todayFeedingRate: 0,
    todayExceptions: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [pieData, setPieData] = useState<PieDataPoint[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get last 7 days for chart
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const todayParams = `?startDate=${today.toISOString()}&endDate=${new Date(today.getTime() + 86400000).toISOString()}`;
      const weekParams = `?startDate=${sevenDaysAgo.toISOString()}&endDate=${new Date(today.getTime() + 86400000).toISOString()}`;

      const [
        childrenRes,
        usersRes,
        todayAttendanceRes,
        todayFeedingRes,
        weekAttendanceRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/children`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        }),
        fetch(`${API_BASE}/admin/users`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        }),
        fetch(`${API_BASE}/records/attendance${todayParams}`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        }),
        fetch(`${API_BASE}/records/feeding${todayParams}`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        }),
        fetch(`${API_BASE}/records/attendance${weekParams}`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        }),
      ]);

      const children = await childrenRes.json().catch(() => []);
      const users = await usersRes.json().catch(() => []);
      const todayAttendance = await todayAttendanceRes.json().catch(() => []);
      const todayFeeding = await todayFeedingRes.json().catch(() => []);
      const weekAttendance = await weekAttendanceRes.json().catch(() => []);

      const childrenArray = Array.isArray(children) ? children : [];
      const usersArray = Array.isArray(users) ? users : [];
      const todayAttendanceArray = Array.isArray(todayAttendance)
        ? todayAttendance
        : [];
      const todayFeedingArray = Array.isArray(todayFeeding) ? todayFeeding : [];
      const weekAttendanceArray = Array.isArray(weekAttendance)
        ? weekAttendance
        : [];

      // Calculate today's stats
      const totalChildren = childrenArray.length;
      const activeChildren = childrenArray.filter(
        (c: any) => c.status === "Active",
      ).length;
      const totalTeachers = usersArray.filter(
        (u: any) => u.role === "teacher",
      ).length;

      let todayAttTotal = 0;
      let todayAttPresent = 0;
      todayAttendanceArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          todayAttTotal += 1;
          if (record.status === "present") todayAttPresent += 1;
        });
      });

      let todayFeedTotal = 0;
      let todayFeedCompleted = 0;
      todayFeedingArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          todayFeedTotal += 1;
          if (record.status === "completed") todayFeedCompleted += 1;
        });
      });

      const todayAttendanceRate = todayAttTotal
        ? Math.round((todayAttPresent / todayAttTotal) * 100)
        : 0;
      const todayFeedingRate = todayFeedTotal
        ? Math.round((todayFeedCompleted / todayFeedTotal) * 100)
        : 0;
      const todayExceptions =
        todayAttTotal - todayAttPresent + (todayFeedTotal - todayFeedCompleted);

      setStats({
        totalChildren,
        activeChildren,
        totalTeachers,
        todayAttendanceRate,
        todayFeedingRate,
        todayExceptions,
      });

      // Build chart data
      const dayMap = new Map<string, { total: number; present: number }>();
      weekAttendanceArray.forEach((entry: any) => {
        const date = new Date(entry.date);
        date.setHours(0, 0, 0, 0);
        const key = date.toISOString().split("T")[0];

        if (!dayMap.has(key)) {
          dayMap.set(key, { total: 0, present: 0 });
        }
        const bucket = dayMap.get(key)!;

        entry.records?.forEach((record: any) => {
          bucket.total += 1;
          if (record.status === "present") bucket.present += 1;
        });
      });

      const chartPoints: ChartDataPoint[] = [];
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().split("T")[0];
        const data = dayMap.get(key) || { total: 0, present: 0 };
        const rate = data.total
          ? Math.round((data.present / data.total) * 100)
          : 0;

        const dayName =
          days[d.getDay() === 0 ? 6 : d.getDay() - 1] || `Day ${i}`;

        chartPoints.push({
          day: dayName,
          attendance: rate,
          target: 95,
        });
      }

      setChartData(chartPoints);

      // Calculate pie chart data (today's status distribution)
      const pieChartData: PieDataPoint[] = [
        {
          name: "Present",
          value: todayAttPresent,
          color: "#10b981",
        },
        {
          name: "Absent",
          value: todayAttTotal - todayAttPresent,
          color: "#f43f5e",
        },
      ];
      setPieData(pieChartData);

      // Build recent activities from today's attendance and feeding
      const activities: RecentActivity[] = [];
      
      todayAttendanceArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          const child = record.child;
          if (child && (child.firstName || child.first)) {
            const childName = `${child.lastName || child.last || ""}, ${child.firstName || child.first || ""} ${child.middleName || child.middle || ""}`.trim();
            activities.push({
              id: `att-${record._id || Math.random()}`,
              type: "attendance",
              childName,
              action: record.status === "present" ? "Checked in" : "Marked absent",
              timestamp: new Date(entry.date).toLocaleString(),
              status: record.status,
            });
          }
        });
      });

      todayFeedingArray.forEach((entry: any) => {
        entry.records?.forEach((record: any) => {
          const child = record.child;
          if (child && (child.firstName || child.first)) {
            const childName = `${child.lastName || child.last || ""}, ${child.firstName || child.first || ""} ${child.middleName || child.middle || ""}`.trim();
            activities.push({
              id: `feed-${record._id || Math.random()}`,
              type: "feeding",
              childName,
              action: record.status === "completed" ? "Fed lunch" : "Missed lunch",
              timestamp: new Date(entry.date).toLocaleString(),
              status: record.status,
            });
          }
        });
      });

      // Sort by timestamp (most recent first) and take top 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
                subtitle="Present today"
                trend={{ value: "↑ 2%", isUp: true }}
                icon={Calendar}
                color="teal"
              />
              <StatCard
                title="Lunch Feeding Compliance"
                value={`${stats.todayFeedingRate}%`}
                subtitle="Children fed"
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
                    Distribution of present vs absent students
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
                    <span className="text-gray-600">Present: {pieData[0]?.value || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                    <span className="text-gray-600">Absent: {pieData[1]?.value || 0}</span>
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

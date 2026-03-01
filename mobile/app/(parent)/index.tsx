import React, { useMemo, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as Icons from "lucide-react-native";
import { useAuth } from "@/src/hooks/useAuth";
import { getMyChildren, Child } from "@/src/api/parent.api";
import {
  getAttendanceHistory,
  getFeedingHistory,
  getTodayAttendance,
  getTodayFeeding,
} from "@/src/api/records.api";
import { StatRow, ProgressBar } from "@/src/utils/dashboard-overview";

type StatCardProps = {
  title: string;
  value: string | number;
  variant?: "blue" | "green" | "white" | "amber";
  icon: React.ReactNode;
};

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
};

export default function ParentDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<any[]>([]);
  const [todayAttendanceRecord, setTodayAttendanceRecord] = useState<any>(null);
  const [todayFeedingRecord, setTodayFeedingRecord] = useState<any>(null);
  const centerName = "Child Development Center";

  // Dynamic date
  const currentDate = new Date();
  const dateParts = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).formatToParts(currentDate);

  const weekday =
    dateParts.find((part) => part.type === "weekday")?.value ?? "";
  const month = dateParts.find((part) => part.type === "month")?.value ?? "";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "";
  const year = dateParts.find((part) => part.type === "year")?.value ?? "";

  const dateLabel = `${weekday} ${month}, ${day} ${year}`.trim();

  const fetchData = React.useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) setLoading(true);
        setError(null);

        if (token) {
          const data = await getMyChildren(token);
          setChildren(data);

          // Set first child as selected if none selected
          if (!selectedChildId && data.length > 0) {
            setSelectedChildId(data[0]._id);
          }

          // Fetch attendance and feeding records
          const [attendance, feeding, todayAttendance, todayFeeding] =
            await Promise.all([
              getAttendanceHistory(token),
              getFeedingHistory(token),
              getTodayAttendance(token).catch(() => null),
              getTodayFeeding(token).catch(() => null),
            ]);

          setAttendanceRecords(attendance);
          setFeedingRecords(feeding);
          setTodayAttendanceRecord(todayAttendance);
          setTodayFeedingRecord(todayFeeding);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load children");
      } finally {
        setLoading(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    [token, selectedChildId],
  );

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const child = useMemo(() => {
    if (!selectedChildId) return children[0] ?? null;
    return (
      children.find((c) => c._id === selectedChildId) ?? children[0] ?? null
    );
  }, [children, selectedChildId]);

  const childFullName = useMemo(() => {
    if (!child) return "";
    const middle = child.middleName ? ` ${child.middleName}` : "";
    return `${child.firstName}${middle} ${child.lastName}`
      .replace(/\s+/g, " ")
      .trim();
  }, [child]);

  const initials = useMemo(() => {
    if (!child) return "";
    const a = child.firstName.charAt(0) ?? "";
    const b = child.lastName.charAt(0) ?? "";
    return (a + b).toUpperCase() || "-";
  }, [child]);

  const childAge = child?.age ?? "-";
  const childGender = child?.gender ? child.gender : "-";
  const enrolledText = child?.enrollmentDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila",
      }).format(new Date(child.enrollmentDate))
    : "-";

  // Calculate statistics for the selected child
  const stats = useMemo(() => {
    if (!child) {
      return {
        present: 0,
        absent: 0,
        mealsCompleted: 0,
        mealsMissed: 0,
      };
    }

    let present = 0;
    let absent = 0;
    let mealsCompleted = 0;
    let mealsMissed = 0;

    // Count attendance records for this child
    attendanceRecords.forEach((record: any) => {
      if (record.records && Array.isArray(record.records)) {
        record.records.forEach((r: any) => {
          const childId = typeof r.child === "object" ? r.child._id : r.child;
          if (childId === child._id) {
            if (r.status === "present") {
              present++;
            } else if (r.status === "absent") {
              absent++;
            }
          }
        });
      }
    });

    // Count feeding records for this child
    feedingRecords.forEach((record: any) => {
      if (record.records && Array.isArray(record.records)) {
        record.records.forEach((r: any) => {
          const childId = typeof r.child === "object" ? r.child._id : r.child;
          if (childId === child._id) {
            if (r.status === "completed") {
              mealsCompleted++;
            } else if (r.status === "missed") {
              mealsMissed++;
            }
          }
        });
      }
    });

    return {
      present,
      absent,
      mealsCompleted,
      mealsMissed,
    };
  }, [child, attendanceRecords, feedingRecords]);

  const totalChildren = useMemo(() => children.length, [children.length]);

  const presentToday = useMemo(() => {
    if (
      !todayAttendanceRecord?.records ||
      !Array.isArray(todayAttendanceRecord.records)
    ) {
      return 0;
    }

    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayAttendanceRecord.records.filter((record: any) => {
      const childId =
        typeof record?.child === "object"
          ? String(record?.child?._id)
          : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "present";
    }).length;
  }, [todayAttendanceRecord, children]);

  const absentToday = useMemo(() => {
    if (
      !todayAttendanceRecord?.records ||
      !Array.isArray(todayAttendanceRecord.records)
    ) {
      return 0;
    }

    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayAttendanceRecord.records.filter((record: any) => {
      const childId =
        typeof record?.child === "object"
          ? String(record?.child?._id)
          : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "absent";
    }).length;
  }, [todayAttendanceRecord, children]);

  const feedingDoneToday = useMemo(() => {
    if (
      !todayFeedingRecord?.records ||
      !Array.isArray(todayFeedingRecord.records)
    ) {
      return 0;
    }

    const linkedChildIds = new Set(children.map((item) => item._id));
    return todayFeedingRecord.records.filter((record: any) => {
      const childId =
        typeof record?.child === "object"
          ? String(record?.child?._id)
          : String(record?.child);
      return linkedChildIds.has(childId) && record?.status === "completed";
    }).length;
  }, [todayFeedingRecord, children]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-5"
        >
          <Text className="text-3xl font-extrabold text-white">Dashboard</Text>
          <Text className="text-lg text-teal-100 mt-1">
            Loading your overview...
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="mt-4 text-base text-gray-600 font-medium">
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !child) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-5"
        >
          <Text className="text-3xl font-extrabold text-white">Dashboard</Text>
          <Text className="text-lg text-teal-100 mt-1">Parent Overview</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Icons.Users size={64} color="#D1D5DB" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            {error || "No Children Linked"}
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            {error
              ? "Please try again or contact support."
              : "No children are linked to your account yet."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <Text className="text-3xl font-extrabold text-white">
          Today&apos;s Overview
        </Text>
        <Text className="text-lg text-teal-100 mt-1">
          Here&apos;s your child&apos;s dashboard
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14B8A6"
            colors={["#14B8A6"]}
          />
        }
      >
        {/* Date & Center Card */}
        <View className="mb-5 rounded-3xl bg-teal-600 p-5 shadow-md">
          <View className="flex-row items-start">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <Icons.Calendar size={24} color="#14B8A6" />
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-base font-bold text-white">
                {dateLabel}
              </Text>

              <View className="mt-2 flex-row items-center">
                <Icons.Home size={18} color="white" />
                <Text className="ml-2 text-sm text-teal-50">{centerName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Child Info Card */}
        <View className="mb-6 rounded-3xl bg-teal-600 p-5 shadow-md">
          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mr-4">
              <Text className="text-teal-600 text-2xl font-bold">
                {initials}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                {childFullName}
              </Text>
              <Text className="text-base text-teal-100 mt-1">
                {childAge} years old • {String(childGender).toLowerCase()}
              </Text>

              <View className="flex-row items-center mt-1">
                <Icons.Calendar size={16} color="white" />
                <Text className="text-sm text-teal-50 ml-2">
                  Enrolled: {enrolledText}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="mb-6 flex-row gap-4">
          <View className="flex-1">
            <StatCard
              title="Total Children"
              value={totalChildren}
              icon={<Icons.Users size={24} color="#0284C7" />}
              variant="blue"
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Present Today"
              value={presentToday}
              icon={<Icons.UserCheck size={24} color="#059669" />}
              variant="green"
            />
          </View>
        </View>

        <View className="mb-7 flex-row gap-4">
          <View className="flex-1">
            <StatCard
              title="Absent Today"
              value={absentToday}
              icon={<Icons.UserX size={24} color="#C2410C" />}
              variant="amber"
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Feeding Done"
              value={feedingDoneToday}
              icon={<Icons.UtensilsCrossed size={24} color="#059669" />}
              variant="green"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-7 rounded-3xl bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
              <Icons.Zap size={20} color="#14B8A6" />
            </View>
            <Text className="ml-3 text-xl font-bold text-gray-900">
              Quick Actions
            </Text>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <ActionCard
                title="View Attendance"
                subtitle=""
                icon={<Icons.ClipboardCheck size={24} color="#14B8A6" />}
                onPress={() => router.push("./parent-view-record/attendance")}
              />
            </View>

            <View className="flex-1">
              <ActionCard
                title="View Feeding"
                subtitle=""
                icon={<Icons.Utensils size={24} color="#14B8A6" />}
                onPress={() => router.push("./parent-view-record/feeding")}
              />
            </View>
          </View>
        </View>

        {/* Attendance & Feeding Breakdown */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          {/* Attendance Section */}
          <View className="flex-row items-center mb-3">
            <Icons.Calendar size={20} color="#10B981" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Attendance Breakdown
            </Text>
          </View>
          <StatRow
            color="#22C55E"
            label="Present"
            value={`${stats.present} days`}
          />
          <StatRow
            color="#9CA3AF"
            label="Absent"
            value={`${stats.absent} days`}
          />

          {/* Divider */}
          <View className="my-5 h-px bg-gray-200" />

          {/* Feeding Section */}
          <View className="flex-row items-center mb-3">
            <Icons.Utensils size={20} color="#10B981" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Feeding Overview
            </Text>
          </View>
          <StatRow
            color="#22C55E"
            label="Meals Completed"
            value={`${stats.mealsCompleted} days`}
          />
          <StatRow
            color="#9CA3AF"
            label="Meals Missed"
            value={`${stats.mealsMissed} days`}
          />

          <View className="mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Completion Rate</Text>
              <Text className="text-teal-600 font-semibold">
                {stats.mealsCompleted + stats.mealsMissed > 0
                  ? Math.round(
                      (stats.mealsCompleted /
                        (stats.mealsCompleted + stats.mealsMissed)) *
                        100,
                    )
                  : 0}
                %
              </Text>
            </View>
            <View className="mt-2">
              <ProgressBar
                percent={
                  stats.mealsCompleted + stats.mealsMissed > 0
                    ? Math.round(
                        (stats.mealsCompleted /
                          (stats.mealsCompleted + stats.mealsMissed)) *
                          100,
                      )
                    : 0
                }
              />
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="rounded-3xl bg-white mt-6 p-5 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              Recent Updates
            </Text>

            <Pressable
              className="flex-row items-center"
              onPress={() => router.push("/(parent)/notifications")}
            >
              <Text className="text-base font-semibold text-teal-600">
                View all
              </Text>
              <Icons.ChevronRight size={18} color="#14B8A6" />
            </Pressable>
          </View>

          <View className="rounded-2xl bg-gray-50 p-4">
            <View className="flex-row">
              <View className="mr-4 w-1.5 rounded-full bg-emerald-600" />
              <View className="flex-1">
                <Text className="text-base font-extrabold text-gray-900">
                  Attendance Recorded
                </Text>
                <Text className="mt-1 text-sm leading-5 text-gray-600">
                  Your child was marked present today.
                </Text>
              </View>
            </View>
          </View>

          <View className="h-3" />

          <View className="rounded-2xl bg-gray-50 p-4">
            <View className="flex-row">
              <View className="mr-4 w-1.5 rounded-full bg-sky-600" />
              <View className="flex-1">
                <Text className="text-base font-extrabold text-gray-900">
                  Meal Completed
                </Text>
                <Text className="mt-1 text-sm leading-5 text-gray-600">
                  Your child finished their lunch today.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating AI Chat button */}
      <Pressable
        onPress={() => router.push("/(parent)/chat")}
        className="absolute right-5 rounded-full bg-teal-600 p-4 active:opacity-90"
        style={{
          bottom: 24 + insets.bottom + 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Icons.MessageCircle size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

/* ---------------- Components ---------------- */
function StatCard({ title, value, variant = "white", icon }: StatCardProps) {
  const styles =
    variant === "blue"
      ? "bg-sky-50 border-sky-100"
      : variant === "green"
        ? "bg-emerald-50 border-emerald-100"
        : variant === "amber"
          ? "bg-orange-50 border-orange-100"
          : "bg-white border-gray-100";

  const iconWrap =
    variant === "blue"
      ? "bg-sky-100"
      : variant === "green"
        ? "bg-emerald-100"
        : variant === "amber"
          ? "bg-orange-100"
          : "bg-gray-100";

  return (
    <View
      className={`rounded-3xl border p-4 ${styles}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`h-12 w-12 items-center justify-center rounded-2xl ${iconWrap}`}
        >
          {icon}
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-700">{title}</Text>
          <Text className="mt-2 text-4xl font-extrabold text-gray-900">
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ActionCard({ title, subtitle, icon, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm active:opacity-70 active:scale-95"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
          {icon}
        </View>

        <Text className="mt-4 text-center text-base font-bold text-gray-900">
          {title}
        </Text>

        {subtitle ? (
          <Text className="mt-1 text-center text-sm font-medium text-gray-500">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

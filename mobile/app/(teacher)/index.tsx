import React, { useEffect, useMemo, useState } from "react";
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
import { getChildren, getTeacherProfile } from "@/src/api/teacher.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";

type StatCardProps = {
  title: string;
  value: string | number;
  variant?: "blue" | "green" | "white";
  icon: React.ReactNode;
};

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
};

type NoticeItemProps = {
  title: string;
  desc: string;
  tone?: "emerald" | "blue" | "orange";
  onPress?: () => void;
};

export default function TeacherDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [feedingData, setFeedingData] = useState<any>(null);
  const [teacherName, setTeacherName] = useState<string>("Teacher");
  const centerName = "Child Development Center";

  // Dynamic date
  const currentDate = new Date();
  const dateLabel = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const fetchData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      if (token) {
        const [childrenData, todayAttendance, todayFeeding, profileData] =
          await Promise.all([
            getChildren(token),
            getTodayAttendance(token),
            getTodayFeeding(token),
            getTeacherProfile(token),
          ]);
        setChildren(childrenData);
        setAttendanceData(todayAttendance);
        setFeedingData(todayFeeding);

        // Set teacher name from profile
        if (profileData?.firstName) {
          setTeacherName(profileData.firstName);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [token]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const totalChildren = useMemo(() => children.length, [children.length]);

  const presentToday = useMemo(() => {
    if (!attendanceData || !attendanceData.records) return 0;
    return attendanceData.records.filter(
      (record: any) => record.status === "present",
    ).length;
  }, [attendanceData]);

  const absentToday = useMemo(() => {
    if (!attendanceData || !attendanceData.records) return 0;
    return attendanceData.records.filter(
      (record: any) => record.status === "absent",
    ).length;
  }, [attendanceData]);

  const feedingDone = useMemo(() => {
    if (!feedingData || !feedingData.records) return 0;
    return feedingData.records.filter(
      (record: any) => record.status === "completed",
    ).length;
  }, [feedingData]);

  const pendingCount = totalChildren;

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
          Today's Overview, {teacherName}
        </Text>
        <Text className="text-lg text-teal-100 mt-1">
          Here's your dashboard for today
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
              icon={<Icons.UserX size={24} color="#374151" />}
              variant="white"
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Feeding Done"
              value={feedingDone}
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
                title="Record Attendance"
                subtitle=""
                icon={<Icons.ClipboardCheck size={24} color="#14B8A6" />}
                onPress={() =>
                  router.push("/(teacher)/teacher-record-data/attendance")
                }
              />
            </View>

            <View className="flex-1">
              <ActionCard
                title="Record Feeding"
                subtitle=""
                icon={<Icons.Utensils size={24} color="#14B8A6" />}
                onPress={() =>
                  router.push("/(teacher)/teacher-record-data/feeding")
                }
              />
            </View>
          </View>
        </View>

        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              Recent Notifications
            </Text>

            <Pressable
              className="flex-row items-center"
              onPress={() => router.push("/(teacher)/notifications")}
            >
              <Text className="text-base font-semibold text-teal-600">
                View all
              </Text>
              <Icons.ChevronRight size={18} color="#14B8A6" />
            </Pressable>
          </View>

          <NoticeItem
            title="Monthly Report Due"
            desc="Please submit the monthly attendance and feeding report."
            tone="emerald"
            onPress={() => {}}
          />
          <View className="h-3" />
          <NoticeItem
            title="System Maintenance"
            desc="The system will undergo maintenance on Saturday."
            tone="blue"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
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
        : "bg-white border-gray-100";

  const iconWrap =
    variant === "blue"
      ? "bg-sky-100"
      : variant === "green"
        ? "bg-emerald-100"
        : "bg-gray-100";

  const iconColor =
    variant === "blue"
      ? "#0284C7"
      : variant === "green"
        ? "#059669"
        : "#374151";

  return (
    <View className={`rounded-3xl border p-4 ${styles} shadow-sm`}>
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
      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm active:opacity-70 active:scale-95"
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

function NoticeItem({
  title,
  desc,
  tone = "emerald",
  onPress,
}: NoticeItemProps) {
  const bar =
    tone === "emerald"
      ? "bg-emerald-600"
      : tone === "blue"
        ? "bg-sky-600"
        : "bg-orange-500";

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl bg-gray-50 p-4 active:opacity-90"
    >
      <View className="flex-row">
        <View className={`mr-4 w-1.5 rounded-full ${bar}`} />
        <View className="flex-1">
          <Text className="text-base font-extrabold text-gray-900">
            {title}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-gray-600">{desc}</Text>
        </View>
      </View>
    </Pressable>
  );
}

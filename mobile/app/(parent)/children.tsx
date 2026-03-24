import React, { useCallback, useMemo, useState } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useRouter } from "expo-router";
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
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import {
  getAttendanceHistory,
  getFeedingHistory,
  getTodayAttendance,
  getTodayFeeding,
} from "@/src/api/records.api";

type DailyAttendance = "Present" | "Absent" | "No update yet";
type DailyFeeding = "Finished" | "Missed" | "No update yet";

type DailyChildStatus = {
  attendance: DailyAttendance;
  feeding: DailyFeeding;
  lastUpdated: string;
  tone: "good" | "warning" | "neutral";
};

type MonthlySummary = {
  attendanceRate: number;
  feedingRate: number;
  attendanceDone: number;
  attendanceTotal: number;
  feedingDone: number;
  feedingTotal: number;
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const getRecordChildId = (record: any): string => {
  if (typeof record?.child === "string") return record.child;
  return record?.child?._id ? String(record.child._id) : "";
};

const getFullName = (child: Child): string => {
  const middle = child.middleName ? ` ${child.middleName}` : "";
  return `${child.firstName}${middle} ${child.lastName}`
    .replace(/\s+/g, " ")
    .trim();
};

const formatStatusTimestamp = (rawDate: string | null): string => {
  if (!rawDate) return "Waiting for teacher update";

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "Waiting for teacher update";

  return parsed.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
};

const toPercent = (done: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
};

export default function ParentChildrenScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { token } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [todayAttendanceRecord, setTodayAttendanceRecord] = useState<any>(null);
  const [todayFeedingRecord, setTodayFeedingRecord] = useState<any>(null);
  const [monthAttendanceRecords, setMonthAttendanceRecords] = useState<any[]>(
    [],
  );
  const [monthFeedingRecords, setMonthFeedingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    timeZone: "Asia/Manila",
  }).format(new Date());

  const loadScreenData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) setLoading(true);
        setError(null);

        if (!token) throw new Error("No authentication token");

        const { startDate, endDate } = getMonthRange();

        const [
          childrenData,
          todayAttendance,
          todayFeeding,
          attendanceHistory,
          feedingHistory,
        ] = await Promise.all([
          getMyChildren(token),
          getTodayAttendance(token).catch(() => null),
          getTodayFeeding(token).catch(() => null),
          getAttendanceHistory(token, startDate, endDate).catch(() => []),
          getFeedingHistory(token, startDate, endDate).catch(() => []),
        ]);

        setChildren(childrenData);
        setTodayAttendanceRecord(todayAttendance);
        setTodayFeedingRecord(todayFeeding);
        setMonthAttendanceRecords(
          Array.isArray(attendanceHistory) ? attendanceHistory : [],
        );
        setMonthFeedingRecords(
          Array.isArray(feedingHistory) ? feedingHistory : [],
        );

        setSelectedChildId((prev) => {
          if (prev && childrenData.some((child) => child._id === prev)) {
            return prev;
          }
          return childrenData[0]?._id ?? null;
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load your children");
      } finally {
        setLoading(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    React.useCallback(() => {
      loadScreenData();
    }, [loadScreenData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadScreenData(true);
  };

  const selectedChild = useMemo(() => {
    if (!children.length) return null;

    if (!selectedChildId) return children[0];
    return (
      children.find((child) => child._id === selectedChildId) ?? children[0]
    );
  }, [children, selectedChildId]);

  const childStatus = useMemo<DailyChildStatus>(() => {
    if (!selectedChild) {
      return {
        attendance: "No update yet",
        feeding: "No update yet",
        lastUpdated: "Waiting for teacher update",
        tone: "neutral",
      };
    }

    let attendance: DailyAttendance = "No update yet";
    let feeding: DailyFeeding = "No update yet";

    const attendanceEntry = todayAttendanceRecord?.records?.find(
      (record: any) => getRecordChildId(record) === selectedChild._id,
    );

    if (attendanceEntry) {
      attendance = attendanceEntry.status === "present" ? "Present" : "Absent";
    }

    const feedingEntry = todayFeedingRecord?.records?.find(
      (record: any) => getRecordChildId(record) === selectedChild._id,
    );

    if (feedingEntry) {
      feeding = feedingEntry.status === "completed" ? "Finished" : "Missed";
    }

    const timestampCandidates = [
      todayAttendanceRecord?.updatedAt,
      todayAttendanceRecord?.createdAt,
      todayAttendanceRecord?.date,
      todayFeedingRecord?.updatedAt,
      todayFeedingRecord?.createdAt,
      todayFeedingRecord?.date,
    ]
      .map((value) => (value ? new Date(value) : null))
      .filter((value): value is Date =>
        Boolean(value && !Number.isNaN(value.getTime())),
      );

    const latestTimestamp =
      timestampCandidates.length > 0
        ? new Date(
            Math.max(...timestampCandidates.map((value) => value.getTime())),
          )
        : null;

    let tone: DailyChildStatus["tone"] = "neutral";
    if (attendance === "Present" && feeding === "Finished") {
      tone = "good";
    } else if (attendance === "Absent" || feeding === "Missed") {
      tone = "warning";
    }

    return {
      attendance,
      feeding,
      lastUpdated: formatStatusTimestamp(
        latestTimestamp ? latestTimestamp.toISOString() : null,
      ),
      tone,
    };
  }, [selectedChild, todayAttendanceRecord, todayFeedingRecord]);

  const monthlySummary = useMemo<MonthlySummary>(() => {
    if (!selectedChild) {
      return {
        attendanceRate: 0,
        feedingRate: 0,
        attendanceDone: 0,
        attendanceTotal: 0,
        feedingDone: 0,
        feedingTotal: 0,
      };
    }

    let attendanceDone = 0;
    let attendanceTotal = 0;
    let feedingDone = 0;
    let feedingTotal = 0;

    monthAttendanceRecords.forEach((record: any) => {
      if (!Array.isArray(record?.records)) return;

      record.records.forEach((entry: any) => {
        if (getRecordChildId(entry) !== selectedChild._id) return;
        attendanceTotal += 1;
        if (entry.status === "present") attendanceDone += 1;
      });
    });

    monthFeedingRecords.forEach((record: any) => {
      if (!Array.isArray(record?.records)) return;

      record.records.forEach((entry: any) => {
        if (getRecordChildId(entry) !== selectedChild._id) return;
        feedingTotal += 1;
        if (entry.status === "completed") feedingDone += 1;
      });
    });

    return {
      attendanceRate: toPercent(attendanceDone, attendanceTotal),
      feedingRate: toPercent(feedingDone, feedingTotal),
      attendanceDone,
      attendanceTotal,
      feedingDone,
      feedingTotal,
    };
  }, [selectedChild, monthAttendanceRecords, monthFeedingRecords]);

  const todayStateText =
    childStatus.tone === "good"
      ? "All updates received"
      : childStatus.tone === "warning"
        ? "Needs attention today"
        : "Waiting for teacher updates";

  const scrollBottomPadding = Math.max(100, tabBarHeight + 24);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-5"
        >
          <Text className="text-3xl font-extrabold text-white">
            My Children
          </Text>
          <Text className="text-lg text-teal-100 mt-1">
            Children linked to your account
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F766E" />
          <Text className="mt-4 text-base font-medium text-gray-600">
            Please wait...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-5"
        >
          <Text className="text-3xl font-extrabold text-white">
            My Children
          </Text>
          <Text className="text-lg text-teal-100 mt-1">
            Children linked to your account
          </Text>
        </View>

        <View className="mx-5 rounded-3xl border border-red-100 bg-white p-5">
          <View className="flex-row items-start">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
              <Icons.AlertCircle size={22} color="#DC2626" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-gray-900">
                Could not fetch child data
              </Text>
              <Text className="mt-1 text-sm leading-5 text-gray-600">
                {error}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => loadScreenData()}
            className="mt-4 items-center rounded-2xl bg-teal-600 px-4 py-3 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">Try again</Text>
          </Pressable>
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

      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <Text className="text-3xl font-extrabold text-white">My Children</Text>
        <Text className="text-lg text-teal-100 mt-1">
          Children linked to your account
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: scrollBottomPadding,
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
        {children.length === 0 ? (
          <View className="mt-2 rounded-3xl border border-gray-100 bg-white p-6">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <Icons.Users size={24} color="#0F766E" />
            </View>
            <Text className="mt-4 text-2xl font-bold text-gray-900">
              No linked children yet
            </Text>
            <Text className="mt-3 text-base leading-7 text-gray-600">
              Ask your school for a child link code, then add it from your
              account to start receiving attendance and feeding updates.
            </Text>
          </View>
        ) : (
          <>
            {children.length > 1 ? (
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold uppercase tracking-wide text-gray-500">
                  Linked Children ({children.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {children.map((child) => {
                    const isActive = child._id === selectedChild?._id;

                    return (
                      <Pressable
                        key={child._id}
                        onPress={() => setSelectedChildId(child._id)}
                        className={`mr-3 rounded-full border px-5 py-2.5 ${
                          isActive
                            ? "border-teal-600 bg-teal-600"
                            : "border-emerald-200 bg-white"
                        }`}
                      >
                        <Text
                          className={`text-lg font-black ${isActive ? "text-white" : "text-gray-700"}`}
                          numberOfLines={1}
                        >
                          {child.firstName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {selectedChild ? (
              <Pressable
                onPress={() =>
                  router.push(
                    `/(parent)/parent-child-details/${selectedChild._id}`,
                  )
                }
                className="mb-6 overflow-hidden rounded-[28px] border border-gray-100 bg-white p-5 active:opacity-90"
                style={{
                  shadowColor: "#0F172A",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row flex-1 pr-3">
                    <View className="h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                      <Icons.Baby size={32} color="#0F766E" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text
                        className="text-3xl font-black text-gray-900"
                        numberOfLines={1}
                      >
                        {getFullName(selectedChild)}
                      </Text>
                      <Text className="mt-1.5 text-lg font-bold text-gray-500">
                        {selectedChild.age} years old -{" "}
                        {String(selectedChild.gender).toLowerCase()}
                      </Text>
                    </View>
                  </View>

                  <Icons.ChevronRight size={28} color="#94A3B8" />
                </View>

                <View className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-bold uppercase tracking-wide text-gray-500">
                      Today status
                    </Text>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        childStatus.tone === "good"
                          ? "bg-emerald-100"
                          : childStatus.tone === "warning"
                            ? "bg-amber-100"
                            : "bg-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          childStatus.tone === "good"
                            ? "text-emerald-700"
                            : childStatus.tone === "warning"
                              ? "text-amber-700"
                              : "text-slate-600"
                        }`}
                      >
                        {todayStateText}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap">
                    <StatusBadge
                      label="Attendance"
                      value={childStatus.attendance}
                      tone={
                        childStatus.attendance === "Present"
                          ? "success"
                          : childStatus.attendance === "Absent"
                            ? "danger"
                            : "neutral"
                      }
                    />
                    <StatusBadge
                      label="Feeding"
                      value={childStatus.feeding}
                      tone={
                        childStatus.feeding === "Finished"
                          ? "success"
                          : childStatus.feeding === "Missed"
                            ? "danger"
                            : "neutral"
                      }
                    />
                  </View>

                  <Text className="mt-3 text-base font-bold text-gray-500">
                    Last update: {childStatus.lastUpdated}
                  </Text>
                </View>
              </Pressable>
            ) : null}

            <View className="mb-6 rounded-[28px] border border-gray-100 bg-white p-5">
              <View className="mb-4 flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
                  <Icons.BarChart3 size={19} color="#0F766E" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-2xl font-black text-gray-900">
                    {monthLabel} Overview
                  </Text>
                  <Text className="text-base font-bold text-gray-500">
                    Progress this month for selected child
                  </Text>
                </View>
              </View>

              <ProgressMetric
                label="Attendance Rate"
                value={monthlySummary.attendanceRate}
                done={monthlySummary.attendanceDone}
                total={monthlySummary.attendanceTotal}
                barColor="#0EA5E9"
              />
              <ProgressMetric
                label="Feeding Rate"
                value={monthlySummary.feedingRate}
                done={monthlySummary.feedingDone}
                total={monthlySummary.feedingTotal}
                barColor="#10B981"
              />
            </View>

            <View className="mb-6 rounded-[28px] border border-gray-100 bg-white p-5">
              <View className="mb-4 flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
                  <Icons.Grid2X2 size={18} color="#B45309" />
                </View>
                <Text className="ml-3 text-2xl font-black text-gray-900">
                  Quick Actions
                </Text>
              </View>

              <View className="gap-3">
                <QuickActionRow
                  icon={<Icons.ClipboardCheck size={20} color="#0F766E" />}
                  title="View Attendance History"
                  subtitle="See daily attendance records"
                  onPress={() =>
                    router.push("/(parent)/parent-view-record/attendance")
                  }
                />
                <QuickActionRow
                  icon={<Icons.Utensils size={20} color="#0F766E" />}
                  title="View Feeding History"
                  subtitle="Review meal completion updates"
                  onPress={() =>
                    router.push("/(parent)/parent-view-record/feeding")
                  }
                />
                <QuickActionRow
                  icon={<Icons.FileText size={20} color="#0F766E" />}
                  title="View Child Profile"
                  subtitle="Open full details and teacher info"
                  onPress={() => {
                    if (!selectedChild) return;
                    router.push(
                      `/(parent)/parent-child-details/${selectedChild._id}`,
                    );
                  }}
                />
              </View>
            </View>

            <View className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <View className="flex-row items-start">
                <Icons.Lightbulb size={18} color="#B45309" />
                 <Text className="ml-2 flex-1 text-lg font-bold leading-7 text-amber-800">
                   Tip: Updates appear after your child&apos;s teacher submits
                   today&apos;s record.
                 </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "neutral";
}) {
  const colors =
    tone === "success"
      ? { wrap: "bg-emerald-100", text: "text-emerald-700" }
      : tone === "danger"
        ? { wrap: "bg-rose-100", text: "text-rose-700" }
        : { wrap: "bg-slate-200", text: "text-slate-600" };

  return (
    <View className={`mr-2 mt-2 rounded-full px-4 py-2 ${colors.wrap}`}>
      <Text className={`text-base font-black ${colors.text}`}>
        {label}: {value}
      </Text>
    </View>
  );
}

function ProgressMetric({
  label,
  value,
  done,
  total,
  barColor,
}: {
  label: string;
  value: number;
  done: number;
  total: number;
  barColor: string;
}) {
  const progressWidth = total > 0 ? Math.max(4, value) : 0;

  return (
    <View className="mb-4 last:mb-0">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-gray-700">{label}</Text>
        <Text className="text-xl font-black text-gray-900">{value}%</Text>
      </View>

      <View className="mt-2 h-4 overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-full rounded-full"
          style={{
            width: `${progressWidth}%`,
            backgroundColor: barColor,
          }}
        />
      </View>

      <Text className="mt-2 text-base font-bold text-gray-500">
        {total > 0
          ? `${done}/${total} recorded days`
          : "No records for this month yet"}
      </Text>
    </View>
  );
}

function QuickActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 active:opacity-80"
    >
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-white">
          {icon}
        </View>

        <View className="ml-4 flex-1">
          <Text className="text-lg font-black text-gray-900">{title}</Text>
          <Text className="mt-1 text-base font-bold text-gray-500">
            {subtitle}
          </Text>
        </View>

        <Icons.ChevronRight size={24} color="#64748B" />
      </View>
    </Pressable>
  );
}

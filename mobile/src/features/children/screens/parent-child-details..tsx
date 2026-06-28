import { useMemo } from "react";
import { Text, View, ActivityIndicator, ScrollView, StatusBar, Pressable, } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getChildById, type Child } from "@/src/api/parent.api";
import { getAttendanceHistory, getFeedingHistory } from "@/src/api/records.api";
import { useAuth } from "@/src/hooks/use-auth";
import { ChevronLeft, User, Mail, Phone, Calendar, BookOpen, Activity, AlertCircle,} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center py-2">
      <View className="h-8 w-8 items-center justify-center rounded-xl bg-gray-50 mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</Text>
        <Text className="text-base font-semibold text-gray-800 mt-0.5">{value}</Text>
      </View>
    </View>
  );
}

export default function ParentChildDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isAuthenticated, user } = useAuth();
  const childId = typeof id === "string" ? id : null;

  const { data, isLoading: loading, error } = useQuery({
    queryKey: mobileQueryKeys.parentChildDetails(childId, user?.email),
    enabled: isAuthenticated && Boolean(childId && user?.email),
    queryFn: async () => {
      if (!childId) {
        throw new Error("Missing required data");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [child, attendanceList, feedingList] = await Promise.all([
        getChildById(childId),
        getAttendanceHistory(today.toISOString(), tomorrow.toISOString()).catch(() => []),
        getFeedingHistory(today.toISOString(), tomorrow.toISOString()).catch(() => []),
      ]);

      if (child.parent?.email !== user?.email) {
        throw new Error("You don't have permission to view this child");
      }

      const attendanceRecord =
        attendanceList.find((record: any) =>
          record.records?.some((r: any) => (r.child?._id || r.child) === child._id),
        ) || null;
      const feedingRecord =
        feedingList.find((record: any) =>
          record.records?.some((r: any) => (r.child?._id || r.child) === child._id),
        ) || null;

      return { child, attendanceRecord, feedingRecord };
    },
  });

  const child: Child | null = data?.child ?? null;
  const attendanceRecord = data?.attendanceRecord ?? null;
  const feedingRecord = data?.feedingRecord ?? null;

  const status = useMemo(() => {
    if (!child) return { attendance: "Not Recorded", feeding: "Not Recorded" };

    let attendance = "Not Recorded";
    let feeding = "Not Recorded";

    if (attendanceRecord?.records) {
      const attendanceEntry = attendanceRecord.records.find(
        (r: any) => (r.child._id || r.child) === child._id,
      );
      if (attendanceEntry) {
        attendance =
          attendanceEntry.status === "present" ? "Present" : "Absent";
      }
    }

    if (feedingRecord?.records) {
      const feedingEntry = feedingRecord.records.find(
        (r: any) => (r.child._id || r.child) === child._id,
      );
      if (feedingEntry) {
        feeding = feedingEntry.status === "completed" ? "Completed" : "Missed";
      }
    }

    return { attendance, feeding };
  }, [child, attendanceRecord, feedingRecord]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-6"
        >
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3">
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Text className="text-3xl font-extrabold text-white">Child Details</Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="mt-4 text-base font-medium text-gray-500">Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !child) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-6"
        >
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3">
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Text className="text-3xl font-extrabold text-white">Child Details</Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
            <AlertCircle size={28} color="#EF4444" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
            {error instanceof Error ? error.message : "Child not found"}
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
            Please make sure you have permission to view this child&apos;s details.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-2 bg-teal-600 px-6 py-3 rounded-2xl active:scale-95"
            style={{
              shadowColor: "#0D9488",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text className="text-white font-bold text-base">
              Back to Children
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${child.firstName} ${child.middleName ? child.middleName + " " : ""}${child.lastName}`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-6"
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3"
          >
            <ChevronLeft size={22} color="white" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-white" numberOfLines={1}>
              {fullName}
            </Text>
            <Text className="text-base text-teal-100 mt-0.5">
              Student ID: {child.studentId}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="rounded-3xl bg-white p-5 mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center mb-4 gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
              <Activity size={20} color="#059669" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              Today&apos;s Status
            </Text>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View
              className={`flex-1 rounded-2xl px-4 py-3 ${
                status.attendance === "Present"
                  ? "bg-emerald-50 border border-emerald-100"
                  : status.attendance === "Absent"
                    ? "bg-red-50 border border-red-100"
                    : "bg-gray-50 border border-gray-200"
              }`}
            >
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance</Text>
              <Text
                className={`text-lg font-bold mt-0.5 ${
                  status.attendance === "Present"
                    ? "text-emerald-700"
                    : status.attendance === "Absent"
                      ? "text-red-700"
                      : "text-gray-600"
                }`}
              >
                {status.attendance}
              </Text>
            </View>

            <View
              className={`flex-1 rounded-2xl px-4 py-3 ${
                status.feeding === "Completed"
                  ? "bg-emerald-50 border border-emerald-100"
                  : status.feeding === "Missed"
                    ? "bg-red-50 border border-red-100"
                    : "bg-gray-50 border border-gray-200"
              }`}
            >
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">Feeding</Text>
              <Text
                className={`text-lg font-bold mt-0.5 ${
                  status.feeding === "Completed"
                    ? "text-emerald-700"
                    : status.feeding === "Missed"
                      ? "text-red-700"
                      : "text-gray-600"
                }`}
              >
                {status.feeding}
              </Text>
            </View>
          </View>
        </View>

        <View
          className="rounded-3xl bg-white p-5 mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center mb-4 gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
              <User size={20} color="#0D9488" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Child Information</Text>
          </View>

          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2 mb-4">
              <InfoRow
                icon={<BookOpen size={18} color="#0D9488" />}
                label="Age"
                value={`${child.age} years old`}
              />
            </View>
            <View className="w-1/2 pl-2 mb-4">
              <InfoRow
                icon={<User size={18} color="#0D9488" />}
                label="Gender"
                value={child.gender}
              />
            </View>
            <View className="w-1/2 pr-2 mb-4">
              <InfoRow
                icon={<Calendar size={18} color="#0D9488" />}
                label="School Year"
                value={child.schoolYear}
              />
            </View>
            <View className="w-1/2 pl-2 mb-4">
              <InfoRow
                icon={<Activity size={18} color="#0D9488" />}
                label="Status"
                value={child.status}
              />
            </View>
            {child.dateOfBirth && (
              <View className="w-1/2 pr-2 mb-4">
                <InfoRow
                  icon={<Calendar size={18} color="#0D9488" />}
                  label="Date of Birth"
                  value={new Date(child.dateOfBirth).toLocaleDateString(
                    "en-PH",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "Asia/Manila",
                    },
                  )}
                />
              </View>
            )}
            <View className="w-1/2 pl-2 mb-4">
              <InfoRow
                icon={<Calendar size={18} color="#0D9488" />}
                label="Enrollment Date"
                value={new Date(child.enrollmentDate).toLocaleDateString(
                  "en-PH",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "Asia/Manila",
                  },
                )}
              />
            </View>
          </View>
        </View>

        {child.teacher ? (
          <View
            className="rounded-3xl bg-white p-5 mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center mb-4 gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
                <User size={20} color="#0D9488" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Teacher Information
              </Text>
            </View>

            <View className="gap-1">
              <InfoRow
                icon={<User size={18} color="#0D9488" />}
                label="Name"
                value={`${child.teacher.firstName} ${child.teacher.lastName}`}
              />
              <InfoRow
                icon={<Mail size={18} color="#0D9488" />}
                label="Email"
                value={child.teacher.email || "Not available"}
              />
              <InfoRow
                icon={<Phone size={18} color="#0D9488" />}
                label="Contact Number"
                value={child.teacher.phone && child.teacher.phone.trim() !== "" ? child.teacher.phone : "Not available"}
              />
            </View>
          </View>
        ) : (
          <View
            className="rounded-3xl bg-amber-50 p-5 border border-amber-200 mb-4"
            style={{
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
                <User size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-amber-800">
                  No Teacher Assigned
                </Text>
                <Text className="text-sm text-amber-700 mt-1">
                  No teacher record found for today.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

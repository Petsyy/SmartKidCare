import { useMemo } from "react";
import {
  Linking,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Pressable,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getChildById, type Child } from "@/src/api/parent.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import { useAuth } from "@/src/hooks/use-auth";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Activity,
  ShieldCheck,
} from "lucide-react-native";
import {
  buildBlockchainTransactionUrl,
  getBlockchainStatusInfo,
  getBlockchainStatusPalette,
  shortenHash,
} from "@/src/utils/blockchain-status";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export default function TeacherChildDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const childId = typeof id === "string" ? id : null;

  const { data, isLoading: loading, error } = useQuery({
    queryKey: mobileQueryKeys.teacherChildDetails(token, childId),
    enabled: Boolean(token && childId),
    queryFn: async () => {
      if (!token || !childId) {
        throw new Error("Missing required data");
      }
      const [child, attendanceRecord, feedingRecord] = await Promise.all([
        getChildById(token, childId),
        getTodayAttendance(token).catch(() => null),
        getTodayFeeding(token).catch(() => null),
      ]);
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
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-6"
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.push("/(teacher)/children")}
              className="mr-3"
            >
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Text className="text-3xl font-extrabold text-white">
              Child Details
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="mt-4 text-base font-medium text-gray-500">
            Loading details...
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
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-6"
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.push("/(teacher)/children")}
              className="mr-3"
            >
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Text className="text-3xl font-extrabold text-white">
              Child Details
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
            <User size={28} color="#EF4444" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
            {error instanceof Error ? error.message : "Child not found"}
          </Text>
          <Pressable
            onPress={() => router.push("/(teacher)/children")}
            className="mt-4 bg-teal-600 px-6 py-3 rounded-2xl active:scale-95"
            style={{
              shadowColor: "#0D9488",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text className="text-white font-bold text-base">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${child.firstName} ${child.middleName ? child.middleName + " " : ""}${child.lastName}`;
  const blockchainStatus = getBlockchainStatusInfo(child.documentIntegrity);
  const blockchainPalette = getBlockchainStatusPalette(blockchainStatus.key);
  const transactionUrl = buildBlockchainTransactionUrl(blockchainStatus.txHash);

  const openTransaction = async () => {
    if (!transactionUrl) return;
    try {
      await Linking.openURL(transactionUrl);
    } catch (error) {
      console.warn("Failed to open transaction URL:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-6"
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.push("/(teacher)/children")}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3"
          >
            <ChevronLeft size={22} color="white" />
          </Pressable>

          <View className="flex-1">
            <Text
              className="text-2xl font-extrabold text-white"
              numberOfLines={1}
            >
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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Status Card */}
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
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Attendance
              </Text>
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
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Feeding
              </Text>
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

          {feedingRecord && (
            <View className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Today&apos;s Menu
              </Text>
              <Text className="text-base font-semibold text-gray-800">
                {feedingRecord.foodServed || "Not specified"}
              </Text>
            </View>
          )}
        </View>

        {/* Child Information Card */}
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
              Child Information
            </Text>
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

        {/* Blockchain Card */}
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
              <ShieldCheck size={20} color="#0D9488" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              Blockchain Integrity
            </Text>
          </View>

          <View
            className="rounded-2xl border p-4"
            style={{
              borderColor: blockchainPalette.borderColor,
              backgroundColor: blockchainPalette.backgroundColor,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: blockchainPalette.dotColor }}
              />
              <Text
                className="ml-2 text-base font-semibold"
                style={{ color: blockchainPalette.textColor }}
              >
                {blockchainStatus.label}
              </Text>
            </View>

            <Text className="mt-2 text-sm leading-6 text-gray-700">
              {blockchainStatus.detail}
            </Text>

            <View className="mt-4">
              <InfoRow
                icon={<ShieldCheck size={18} color="#0D9488" />}
                label="Transaction Hash"
                value={shortenHash(blockchainStatus.txHash)}
              />

              <InfoRow
                icon={<Calendar size={18} color="#0D9488" />}
                label="Anchored At"
                value={
                  blockchainStatus.anchoredAt
                    ? new Date(blockchainStatus.anchoredAt).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          timeZone: "Asia/Manila",
                        },
                      )
                    : "Pending"
                }
              />
            </View>

            {transactionUrl ? (
              <Pressable
                onPress={openTransaction}
                className="mt-4 rounded-xl bg-teal-600 px-4 py-3 active:scale-95"
                style={{
                  shadowColor: "#0D9488",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text className="text-center text-sm font-bold text-white">
                  View on Sepolia
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Parent Information Card */}
        {child.parent ? (
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
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-sky-50">
                <User size={20} color="#0284C7" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Parent Information
              </Text>
            </View>

            <View className="gap-1">
              <InfoRow
                icon={<User size={18} color="#0284C7" />}
                label="Name"
                value={`${child.parent.firstName} ${child.parent.lastName}`}
              />
              <InfoRow
                icon={<Mail size={18} color="#0284C7" />}
                label="Email"
                value={child.parent.email}
              />
              {child.parent.phone && (
                <InfoRow
                  icon={<Phone size={18} color="#0284C7" />}
                  label="Contact Number"
                  value={child.parent.phone}
                />
              )}
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
                  No Parent Linked
                </Text>
                <Text className="text-sm text-amber-700 mt-1">
                  This child has not been linked to a parent account yet.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </Text>
        <Text className="text-base font-semibold text-gray-800 mt-0.5">
          {value}
        </Text>
      </View>
    </View>
  );
}

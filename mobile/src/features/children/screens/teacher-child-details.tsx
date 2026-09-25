import { useMemo, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getChildById, type Child } from "@/src/api/parent.api";
import { getChildParentCredentials, resetChildParentPassword } from "@/src/api/teacher.api";
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
  MapPin,
  Scale,
  Ruler,
  Award,
  TrendingUp,
  Archive,
  ArchiveRestore,
  Edit3,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScreenLoadingState,
  TEACHER_HEADER_GRADIENT,
} from "@/src/components/ui";
import { ViewGuardiansBottomSheet } from "../components/view-guardians-bottom-sheet";
import { AddGuardianBottomSheet } from "../components/add-guardian-bottom-sheet";
import { ParentCredentialsModal } from "@/src/features/enrollment/components/ui/parent-credentials-modal";
import { GrowthHistoryBottomSheet } from "@/src/features/nutrition/components/growth-history-bottom-sheet";
import {
  useArchiveChild,
  useRestoreChild,
} from "../hooks/useArchiveChild";
import type { Guardian } from "@/src/api/api.types";

export default function TeacherChildDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isAuthenticated } = useAuth();
  const childId = typeof id === "string" ? id : null;
  const [isGuardiansSheetOpen, setIsGuardiansSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const { mutate: archiveChild, isPending: isArchiving } =
    useArchiveChild(childId);
  const { mutate: restoreChild, isPending: isRestoring } =
    useRestoreChild(childId);
  const [editGuardian, setEditGuardian] = useState<Guardian | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<{ visible: boolean; email: string; tempPassword?: string | null } | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleViewCredentials = async () => {
    if (!childId) return;
    try {
      setIsLoadingCredentials(true);
      const credentials = await getChildParentCredentials(childId);
      setCredentialsModal({
        visible: true,
        email: credentials.email,
        tempPassword: credentials.tempPassword,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to retrieve credentials.");
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const handleResetPassword = () => {
    if (!childId) return;
    Alert.alert(
      "Reset Parent Password",
      "Are you sure you want to reset this parent's password? Their current password will be invalidated immediately. This will affect their entire account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Password",
          style: "destructive",
          onPress: async () => {
            try {
              setIsResettingPassword(true);
              const credentials = await resetChildParentPassword(childId);
              setCredentialsModal({
                visible: true,
                email: credentials.email,
                tempPassword: credentials.tempPassword,
              });
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to reset password.");
            } finally {
              setIsResettingPassword(false);
            }
          },
        },
      ],
    );
  };

  const handleEditGuardian = (guardian: Guardian, index: number) => {
    setEditGuardian(guardian);
    setEditIndex(index);
    setIsGuardiansSheetOpen(false);
    setTimeout(() => setIsEditSheetOpen(true), 300);
  };

  const handleEditClose = () => {
    setIsEditSheetOpen(false);
    setEditGuardian(null);
    setEditIndex(null);
    setTimeout(() => setIsGuardiansSheetOpen(true), 300);
  };

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: mobileQueryKeys.teacherChildDetails(childId),
    enabled: isAuthenticated && Boolean(childId),
    queryFn: async () => {
      if (!childId) {
        throw new Error("Missing required data");
      }
      const [child, attendanceRecord, feedingRecord] = await Promise.all([
        getChildById(childId),
        getTodayAttendance().catch(() => null),
        getTodayFeeding().catch(() => null),
      ]);
      return { child, attendanceRecord, feedingRecord };
    },
  });

  const child: Child | null = data?.child ?? null;
  const attendanceRecord = data?.attendanceRecord ?? null;
  const feedingRecord = data?.feedingRecord ?? null;
  const isInactive = child?.status === "Inactive";
  const isUpdatingStatus = isArchiving || isRestoring;

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
        <LinearGradient
          colors={TEACHER_HEADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 12 }}
          className="px-5 pb-6"
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
        </LinearGradient>
        <ScreenLoadingState
          title="Loading child details"
          message="Getting the child’s profile and today’s records ready."
        />
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
        <LinearGradient
          colors={TEACHER_HEADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 12 }}
          className="px-5 pb-6"
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
        </LinearGradient>
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* HEADER */}
      <LinearGradient
        colors={TEACHER_HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12 }}
        className="px-5 pb-6"
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
      </LinearGradient>

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

        {/* Quick Actions Row */}
        <View className="flex-row justify-between mb-4 gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/(teacher)/child-details/competencies/[childId]",
                params: { childId: child._id },
              })
            }
            className="flex-1 items-center justify-center bg-white rounded-3xl py-4 active:bg-gray-50"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 mb-2">
              <Award size={24} color="#0D9488" />
            </View>
            <Text className="text-xs font-bold text-gray-700 text-center">Evaluate</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsHistorySheetOpen(true)}
            className="flex-1 items-center justify-center bg-white rounded-3xl py-4 active:bg-gray-50"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 mb-2">
              <TrendingUp size={24} color="#047857" />
            </View>
            <Text className="text-xs font-bold text-gray-700 text-center">History</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsGuardiansSheetOpen(true)}
            className="flex-1 items-center justify-center bg-white rounded-3xl py-4 active:bg-gray-50"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 mb-2">
              <ShieldCheck size={24} color="#0284C7" />
            </View>
            <Text className="text-xs font-bold text-gray-700 text-center">Guardians</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/(teacher)/edit-child/${childId}`)}
            className="flex-1 items-center justify-center bg-white rounded-3xl py-4 active:bg-gray-50"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 mb-2">
              <Edit3 size={24} color="#4F46E5" />
            </View>
            <Text className="text-xs font-bold text-gray-700 text-center">Edit</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isInactive ? "Unarchive child" : "Archive child"}
            disabled={isUpdatingStatus}
            onPress={() => {
              Alert.alert(
                isInactive ? "Unarchive Child" : "Archive Child",
                isInactive
                  ? "This will restore the child to your active children list. Are you sure?"
                  : "This will mark the child as Inactive. They will no longer appear in your active children list. Are you sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: isInactive ? "Unarchive" : "Archive",
                    style: isInactive ? "default" : "destructive",
                    onPress: () =>
                      isInactive ? restoreChild() : archiveChild(),
                  },
                ]
              );
            }}
            className={`flex-1 items-center justify-center bg-white rounded-3xl py-4 active:bg-gray-50 ${
              isUpdatingStatus ? "opacity-60" : ""
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View
              className={`h-12 w-12 items-center justify-center rounded-2xl mb-2 ${
                isInactive ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color={isInactive ? "#047857" : "#E11D48"} />
              ) : isInactive ? (
                <ArchiveRestore size={24} color="#047857" />
              ) : (
                <Archive size={24} color="#E11D48" />
              )}
            </View>
            <Text className="text-xs font-bold text-gray-700 text-center">
              {isUpdatingStatus
                ? isInactive
                  ? "Restoring..."
                  : "Archiving..."
                : isInactive
                  ? "Unarchive"
                  : "Archive"}
            </Text>
          </Pressable>
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
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
                <User size={20} color="#0D9488" />
              </View>
              <Text className="flex-1 text-xl font-bold text-gray-900">
                Child Information
              </Text>
            </View>
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
            <View className="w-full mb-4">
              <InfoRow
                icon={<MapPin size={18} color="#0D9488" />}
                label="Complete Home Address"
                value={child.homeAddress || "Not provided"}
              />
            </View>
            <View className="w-1/2 pr-2 mb-4">
              <InfoRow
                icon={<Scale size={18} color="#0D9488" />}
                label="Weight"
                value={child.weight ? `${child.weight} kg` : "Not provided"}
              />
            </View>
            <View className="w-1/2 pl-2 mb-4">
              <InfoRow
                icon={<Ruler size={18} color="#0D9488" />}
                label="Height"
                value={child.height ? `${child.height} cm` : "Not provided"}
              />
            </View>
            <View className="w-full mb-4">
              <InfoRow
                icon={<Activity size={18} color="#0D9488" />}
                label="Body Type / Nutritional Status"
                value={child.nutritionalStatus || "Not classified"}
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
                icon={<User size={18} color="#0284C7" />}
                label="Relationship"
                value={child.parentRelationship || "Not provided"}
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
            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={handleViewCredentials}
                disabled={isLoadingCredentials}
                className="flex-1 flex-row items-center justify-center gap-2 bg-sky-50 py-3 rounded-xl active:bg-sky-100"
              >
                <ShieldCheck size={20} color="#0284C7" />
                <Text className="text-sky-700 font-semibold text-center text-sm">
                  {isLoadingCredentials ? "Loading..." : "View Initial Credentials"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleResetPassword}
                disabled={isResettingPassword}
                className="flex-1 flex-row items-center justify-center gap-2 bg-rose-50 py-3 rounded-xl active:bg-rose-100"
              >
                <ShieldCheck size={20} color="#E11D48" />
                <Text className="text-rose-700 font-semibold text-center text-sm">
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </Text>
              </Pressable>
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
      
      <ViewGuardiansBottomSheet
        childId={childId}
        childName={fullName}
        visible={isGuardiansSheetOpen}
        onClose={() => setIsGuardiansSheetOpen(false)}
        onEditGuardian={handleEditGuardian}
      />
      <AddGuardianBottomSheet
        childId={childId}
        childName={fullName}
        visible={isEditSheetOpen}
        onClose={handleEditClose}
        editGuardian={editGuardian}
        editIndex={editIndex}
      />
      {isHistorySheetOpen && (
        <GrowthHistoryBottomSheet
          childId={childId || ""}
          childName={fullName}
          visible={isHistorySheetOpen}
          onClose={() => setIsHistorySheetOpen(false)}
        />
      )}

      {credentialsModal && (
        <ParentCredentialsModal
          visible={credentialsModal.visible}
          email={credentialsModal.email}
          tempPassword={credentialsModal.tempPassword}
          onClose={() => setCredentialsModal(null)}
        />
      )}
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

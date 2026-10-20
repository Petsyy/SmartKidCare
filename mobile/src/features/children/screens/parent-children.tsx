import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  CircleCheck,
  Clock3,
  HeartPulse,
  School,
  User,
  Users,
  Award,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Scale,
  Ruler,
  Calendar,
  BookOpen,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react-native";
import type { Child } from "@/src/api/parent.api";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  EmptyStateCard,
  RefreshableScrollView,
  ProfileSection,
} from "@/src/components/ui";
import { useParentChildrenData } from "@/src/features/children/hooks";
import { useChildNutritionHistory } from "@/src/features/nutrition/hooks/useNutrition";
import { GrowthHistoryBottomSheet } from "@/src/features/nutrition/components/growth-history-bottom-sheet";
import { ViewGuardiansBottomSheet } from "@/src/features/children/components/view-guardians-bottom-sheet";
import { CompetencyHistoryBottomSheet } from "@/src/features/competencies";
import { useState } from "react";

const NOT_PROVIDED = "Not provided";

const getFullName = (child: Child): string => {
  const middle = child.middleName ? ` ${child.middleName}` : "";
  return `${child.firstName}${middle} ${child.lastName}`
    .replace(/\s+/g, " ")
    .trim();
};

const toTitleCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getChildDetails = (child: Child): string => {
  const age = `${child.age} ${child.age === 1 ? "year" : "years"} old`;
  const gender = child.gender ? toTitleCase(child.gender) : null;
  return [age, gender].filter(Boolean).join(" · ");
};

const getTeacherFullName = (child: Child): string => {
  if (!child.teacher) return "Not assigned yet";
  const middle = child.teacher.middleName ? ` ${child.teacher.middleName}` : "";
  return `${child.teacher.firstName}${middle} ${child.teacher.lastName}`
    .replace(/\s+/g, " ")
    .trim();
};

const getEnrollmentStatus = (
  status: string,
): { label: string; isActive: boolean } => {
  const normalized = status?.trim().toLowerCase();
  const isActive = ["active", "enrolled", "approved"].includes(normalized);

  if (isActive) return { label: "Enrolled", isActive: true };
  if (!normalized) {
    return { label: "Enrollment status unavailable", isActive: false };
  }

  return { label: toTitleCase(status), isActive: false };
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return NOT_PROVIDED;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
};

/* ───────────────── Sub-components ───────────────── */

function ProfileInfoRow({
  label,
  value,
  valueTone = "default",
  showDivider = true,
}: {
  label: string;
  value: string;
  valueTone?: "default" | "success" | "warning";
  showDivider?: boolean;
}) {
  const valueContainerStyle =
    valueTone === "success" ? "bg-emerald-50" : "bg-amber-50";
  const valueTextStyle =
    valueTone === "success" ? "text-emerald-700" : "text-amber-800";

  return (
    <View
      className={`min-h-14 flex-row items-start py-3.5 ${showDivider ? "border-b border-gray-100" : ""}`}
      accessible
      accessibilityLabel={`${label}. ${value}`}
    >
      <Text className="w-2/5 pr-3 text-base font-bold leading-6 text-gray-500">
        {label}
      </Text>
      {valueTone === "default" ? (
        <Text className="flex-1 text-right text-base font-extrabold leading-6 text-gray-900">
          {value}
        </Text>
      ) : (
        <View className="flex-1 items-end">
          <View className={`rounded-full px-3 py-1 ${valueContainerStyle}`}>
            <Text className={`text-base font-extrabold ${valueTextStyle}`}>
              {value}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function StatusPill({
  label,
  status,
}: {
  label: string;
  status: string | null;
}) {
  const normalizedStatus = status?.trim().toLowerCase() ?? null;
  const isPositive =
    normalizedStatus === "present" || normalizedStatus === "completed";
  const isNegative =
    normalizedStatus === "absent" || normalizedStatus === "missed";

  const iconBackgroundClass = isPositive
    ? "bg-emerald-100"
    : isNegative
      ? "bg-red-100"
      : "bg-gray-200";

  const textClass = isPositive
    ? "text-emerald-700"
    : isNegative
      ? "text-red-700"
      : "text-gray-700";

  const displayValue = isPositive
    ? normalizedStatus === "present"
      ? "Present"
      : "Completed"
    : isNegative
      ? normalizedStatus === "absent"
        ? "Absent"
        : "Missed"
      : "No record";

  const StatusIcon = isPositive
    ? CheckCircle2
    : isNegative
      ? AlertCircle
      : Clock3;

  const iconColor = isPositive ? "#047857" : isNegative ? "#DC2626" : "#4B5563";

  return (
    <View
      className="flex-row items-center"
      accessible
      accessibilityLabel={`${label}: ${displayValue}`}
    >
      <View
        className={`h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBackgroundClass}`}
      >
        <StatusIcon size={18} color={iconColor} />
      </View>
      <View className="ml-2.5 flex-1 justify-center">
        <Text className="text-xs font-semibold text-gray-500">{label}</Text>
        <Text
          numberOfLines={1}
          className={`text-sm font-extrabold ${textClass} mt-0.5`}
        >
          {displayValue}
        </Text>
      </View>
    </View>
  );
}

function NutritionRecordCard({ title, record }: { title: string; record: any }) {
  const isNormal = record.nutritionalStatus === "Normal";
  const isOverweight = record.nutritionalStatus === "Overweight";

  const recordedDate = record.recordedAt || record.createdAt;
  const formattedDate = recordedDate
    ? new Date(recordedDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      })
    : null;

  return (
    <View className="mb-3.5 rounded-2xl border border-gray-100 bg-gray-50/90 p-4">
      {/* Header with Title and Nutritional Status Badge */}
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-gray-900">{title}</Text>
          {formattedDate ? (
            <Text className="text-[11px] font-medium text-gray-400 mt-0.5">
              Assessed on {formattedDate}
            </Text>
          ) : null}
        </View>

        <View
          className={`rounded-full px-2.5 py-1 ${
            isNormal
              ? "bg-emerald-100 border border-emerald-200"
              : isOverweight
                ? "bg-amber-100 border border-amber-200"
                : "bg-red-100 border border-red-200"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isNormal
                ? "text-emerald-800"
                : isOverweight
                  ? "text-amber-800"
                  : "text-red-800"
            }`}
          >
            {record.nutritionalStatus}
          </Text>
        </View>
      </View>

      {/* 3 Glanceable Metric Tiles: Weight, Height, BMI */}
      <View className="flex-row gap-2">
        <View className="flex-1 rounded-xl bg-white p-2.5 items-center border border-gray-100 shadow-2xs">
          <View className="flex-row items-center gap-1 mb-1">
            <Scale size={12} color="#0284C7" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Weight
            </Text>
          </View>
          <Text className="text-sm font-extrabold text-gray-900">
            {record.weight} kg
          </Text>
        </View>

        <View className="flex-1 rounded-xl bg-white p-2.5 items-center border border-gray-100 shadow-2xs">
          <View className="flex-row items-center gap-1 mb-1">
            <Ruler size={12} color="#4F46E5" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Height
            </Text>
          </View>
          <Text className="text-sm font-extrabold text-gray-900">
            {record.height} cm
          </Text>
        </View>

        <View className="flex-1 rounded-xl bg-white p-2.5 items-center border border-gray-100 shadow-2xs">
          <View className="flex-row items-center gap-1 mb-1">
            <Sparkles size={12} color="#0D9488" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              BMI
            </Text>
          </View>
          <Text className="text-sm font-extrabold text-gray-900">
            {Number(record.bmi).toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ParentNutritionSection({
  childId,
  schoolYear,
  onOpenGrowthHistory,
}: {
  childId: string;
  schoolYear?: string;
  onOpenGrowthHistory: () => void;
}) {
  const { data: history, isLoading } = useChildNutritionHistory(childId);

  if (isLoading) {
    return (
      <ProfileSection
        icon={<HeartPulse size={22} color="#047857" />}
        title="Health & Nutrition"
        tone="emerald"
      >
        <View className="items-center py-6">
          <ActivityIndicator color="#047857" />
        </View>
      </ProfileSection>
    );
  }

  const records = history || [];
  const currentRecords = schoolYear
    ? records.filter(
        (r: any) => r.schoolYear === schoolYear && r.status === "submitted",
      )
    : records.filter((r: any) => r.status === "submitted");

  const initialRecord = currentRecords.find((r: any) => r.period === "initial");
  const finalRecord = currentRecords.find((r: any) => r.period === "final");

  return (
    <ProfileSection
      icon={<HeartPulse size={22} color="#047857" />}
      title="Health & Nutrition"
      tone="emerald"
    >
      <View className="px-1 pt-2 pb-1">
        {!initialRecord && !finalRecord ? (
          <View className="py-2">
            <EmptyStateCard
              icon={HeartPulse}
              title="No Assessments Yet"
              description="No nutritional assessments recorded yet for the current school year."
            />
          </View>
        ) : (
          <>
            {initialRecord && (
              <NutritionRecordCard title="Initial Assessment" record={initialRecord} />
            )}
            {finalRecord && (
              <NutritionRecordCard title="Final Assessment" record={finalRecord} />
            )}

            {/* Quick Link to Growth Charts */}
            <Pressable
              onPress={onOpenGrowthHistory}
              accessibilityRole="button"
              accessibilityLabel="View full growth history"
              className="mt-1 flex-row items-center justify-center rounded-xl bg-emerald-50/70 py-2.5 border border-emerald-100 active:bg-emerald-100"
            >
              <TrendingUp size={15} color="#047857" />
              <Text className="ml-1.5 text-xs font-bold text-emerald-800">
                View Full Growth Chart & History →
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ProfileSection>
  );
}



// MAIN SCREEN

export default function ParentChildrenScreen() {
  const [showGuardians, setShowGuardians] = useState(false);
  const [showGrowthHistory, setShowGrowthHistory] = useState(false);
  const [showCompetencyHistory, setShowCompetencyHistory] = useState(false);
  const {
    children,
    selectedChild,
    setSelectedChildId,
    attendanceStatus,
    feedingStatus,
    loading,
    refreshing,
    error,
    loadScreenData,
    onRefresh,
    scrollBottomPadding,
  } = useParentChildrenData();

  const hasMultipleChildren = children.length > 1;
  const screenTitle = hasMultipleChildren ? "My Children" : "My Child";
  const screenSubtitle = hasMultipleChildren
    ? "Choose a child to view their profile"
    : "Profile and care information";

  const enrollmentStatus = selectedChild
    ? getEnrollmentStatus(selectedChild.status)
    : null;

  const childInformationRows = selectedChild
    ? [
        ...(selectedChild.dateOfBirth
          ? [
              {
                label: "Date of Birth",
                value: formatDate(selectedChild.dateOfBirth),
              },
            ]
          : []),
        {
          label: "Enrollment Date",
          value: formatDate(selectedChild.enrollmentDate),
        },
        ...(selectedChild.homeAddress
          ? [{ label: "Home Address", value: selectedChild.homeAddress }]
          : []),
      ]
    : [];

  /* ─── Loading ─── */
  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="brandGradient"
          title="My Child"
          subtitle="Profile and care information"
        />
        <ScreenLoadingState
          variant="details"
          title="Loading child profile"
          message="Getting your child's information ready."
        />
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="brandGradient"
          title={screenTitle}
          subtitle={screenSubtitle}
        />
        <View className="mx-5 rounded-3xl border border-red-100 bg-white p-5">
          <View className="flex-row items-start">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle size={22} color="#DC2626" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-gray-900">
                Could not load child information
              </Text>
              <Text className="mt-1 text-sm leading-5 text-gray-600">
                {error}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => loadScreenData()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading child information"
            className="mt-4 min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-4 active:opacity-80"
          >
            <Text className="text-base font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  /* ─── Main Content ─── */
  return (
    <ScreenShell edges={[]}>
      <ScreenHeader
        backgroundVariant="brandGradient"
        title={screenTitle}
        subtitle={screenSubtitle}
      />

      <RefreshableScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: scrollBottomPadding + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshColor="#14B8A6"
      >
        {/* ── Empty State ── */}
        {children.length === 0 ? (
          <View className="mt-2 rounded-3xl border border-gray-100 bg-white p-6">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <Users size={24} color="#0D9488" />
            </View>
            <Text className="mt-4 text-2xl font-bold text-gray-900">
              No linked children yet
            </Text>
            <Text className="mt-3 text-base leading-7 text-gray-600">
              Your child will appear here after their enrollment is completed.
              Contact your daycare center if you believe they should already be
              listed.
            </Text>
          </View>
        ) : selectedChild ? (
          <>
            {/* ── Multi-child Selector ── */}
            {hasMultipleChildren ? (
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold uppercase tracking-wide text-gray-500">
                  Choose a child ({children.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {children.map((child) => {
                    const isActive = child._id === selectedChild._id;
                    return (
                      <Pressable
                        key={child._id}
                        onPress={() => setSelectedChildId(child._id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${getFullName(child)}`}
                        accessibilityState={{ selected: isActive }}
                        className={`mr-3 min-h-11 justify-center rounded-full border px-5 ${
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

            {/* ── Profile Card (always visible) ── */}
            {selectedChild.status === "Inactive" ? (
              <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-lg font-bold text-amber-900">Archived enrollment</Text>
                <Text className="mt-1 text-sm leading-5 text-amber-800">
                  This profile is read-only. Historical records remain available.{selectedChild.archiveReason ? ` Reason: ${selectedChild.archiveReason}.` : " Reason unavailable."}
                </Text>
              </View>
            ) : null}
            <View className="mb-4 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-2 gap-3">
                  {/* Child Avatar Initials */}
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 border border-teal-200">
                    <Text className="text-lg font-black text-teal-800">
                      {selectedChild.firstName?.[0] || ""}{selectedChild.lastName?.[0] || ""}
                    </Text>
                  </View>

                  <View
                    accessible
                    accessibilityLabel={`${getFullName(selectedChild)}. ${getChildDetails(selectedChild)}. ${enrollmentStatus?.label}`}
                    className="flex-1"
                  >
                    <Text
                      className="text-xl font-black leading-7 text-gray-900"
                      numberOfLines={1}
                      accessibilityRole="header"
                    >
                      {getFullName(selectedChild)}
                    </Text>
                    <View className="mt-0.5 flex-row items-center">
                      <Text className="text-xs font-semibold text-gray-500">
                        {getChildDetails(selectedChild)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Enrollment status badge */}
                <View
                  className={`flex-row items-center rounded-full px-3 py-1 ${
                    enrollmentStatus?.isActive
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  <View
                    className={`mr-1.5 h-2 w-2 rounded-full ${
                      enrollmentStatus?.isActive ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      enrollmentStatus?.isActive
                        ? "text-emerald-700"
                        : "text-gray-600"
                    }`}
                  >
                    {enrollmentStatus?.label}
                  </Text>
                </View>
              </View>

              {/* Today's Care Highlights */}
              <View className="mt-4 rounded-2xl bg-gray-50/90 p-3.5 border border-gray-100">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Today’s Care
                </Text>
                <View className="flex-row items-stretch gap-2.5">
                  <View className="flex-1 rounded-xl bg-white px-3 py-2.5 border border-gray-100 shadow-2xs">
                    <StatusPill label="Attendance" status={attendanceStatus} />
                  </View>
                  <View className="flex-1 rounded-xl bg-white px-3 py-2.5 border border-gray-100 shadow-2xs">
                    <StatusPill label="Feeding" status={feedingStatus} />
                  </View>
                </View>
              </View>
            </View>

            {/* ── Quick Actions ── */}
            <View className="mb-6 flex-row gap-3">
              <Pressable
                onPress={() => setShowCompetencyHistory(true)}
                accessibilityRole="button"
                accessibilityLabel="Open ECCD evaluation history"
                className="flex-1 items-center justify-center rounded-2xl border border-teal-100 bg-white p-4 shadow-sm active:bg-gray-50"
              >
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                  <Award size={24} color="#0D9488" />
                </View>
                <Text className="text-center text-xs font-bold text-gray-700">ECCD History</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowGuardians(true)}
                className="flex-1 items-center justify-center rounded-2xl border border-sky-100 bg-white p-4 shadow-sm active:bg-gray-50"
              >
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-sky-50">
                  <ShieldCheck size={24} color="#0369A1" />
                </View>
                <Text className="text-center text-xs font-bold text-gray-700">Pickups</Text>
              </Pressable>
            </View>

            {/* ── Section 1: School Information ── */}
            <ProfileSection
              icon={<School size={22} color="#0D9488" />}
              title="School Information"
              tone="teal"
            >
              <View className="pt-2">
                {/* Program & School Year Badge Tile */}
                <View className="mb-3 rounded-2xl bg-teal-50/50 p-4 border border-teal-100/70">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                        Enrolled Program
                      </Text>
                      <Text className="text-base font-extrabold text-teal-950 mt-1">
                        {selectedChild.programType || NOT_PROVIDED}
                      </Text>
                    </View>
                    <View className="rounded-full bg-white px-3 py-1 border border-teal-100 shadow-2xs">
                      <Text className="text-xs font-bold text-teal-800">
                        SY {selectedChild.schoolYear || "—"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Assigned Teacher Mini Row */}
                <View className="rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-8 w-8 items-center justify-center rounded-xl bg-teal-100/60">
                      <User size={16} color="#0D9488" />
                    </View>
                    <View>
                      <Text className="text-[11px] font-medium text-gray-400">Class Teacher</Text>
                      <Text className="text-sm font-semibold text-gray-800 mt-0.5">
                        {getTeacherFullName(selectedChild)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ProfileSection>

            {/* ── Section 2: Health Information ── */}
            <ParentNutritionSection
              childId={selectedChild._id}
              schoolYear={selectedChild.schoolYear}
              onOpenGrowthHistory={() => setShowGrowthHistory(true)}
            />

            {/* ── Section 3: Child Information ── */}
            <ProfileSection
              icon={<User size={22} color="#0D9488" />}
              title="Child Information"
              tone="teal"
            >
              <View className="pt-2">
                {/* Metric Highlights */}
                <View className="mb-3 flex-row gap-2">
                  <View className="flex-1 rounded-2xl bg-teal-50/60 p-3 items-center border border-teal-100/60">
                    <View className="flex-row items-center gap-1 mb-1">
                      <BookOpen size={13} color="#0D9488" />
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                        Age
                      </Text>
                    </View>
                    <Text className="text-base font-extrabold text-teal-950">
                      {selectedChild.age ? `${selectedChild.age} yrs` : "—"}
                    </Text>
                  </View>

                  <View className="flex-1 rounded-2xl bg-sky-50/60 p-3 items-center border border-sky-100/60">
                    <View className="flex-row items-center gap-1 mb-1">
                      <Scale size={13} color="#0284C7" />
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                        Weight
                      </Text>
                    </View>
                    <Text className="text-base font-extrabold text-sky-950">
                      {selectedChild.weight ? `${selectedChild.weight} kg` : "—"}
                    </Text>
                  </View>

                  <View className="flex-1 rounded-2xl bg-indigo-50/60 p-3 items-center border border-indigo-100/60">
                    <View className="flex-row items-center gap-1 mb-1">
                      <Ruler size={13} color="#4F46E5" />
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        Height
                      </Text>
                    </View>
                    <Text className="text-base font-extrabold text-indigo-950">
                      {selectedChild.height ? `${selectedChild.height} cm` : "—"}
                    </Text>
                  </View>
                </View>

                {/* Vitals & Dates Micro-Card */}
                <View className="mb-3 rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
                  <View className="mb-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Sparkles size={14} color="#0D9488" />
                      <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Personal Details
                      </Text>
                    </View>
                    {selectedChild.gender ? (
                      <View className="rounded-full bg-teal-50 px-2.5 py-0.5 border border-teal-100">
                        <Text className="text-[11px] font-bold text-teal-800">
                          {toTitleCase(selectedChild.gender)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="flex-row justify-between pt-1">
                    <View className="flex-1 pr-2">
                      <Text className="text-[11px] font-medium text-gray-400">Date of Birth</Text>
                      <Text className="text-sm font-semibold text-gray-800 mt-0.5">
                        {selectedChild.dateOfBirth ? formatDate(selectedChild.dateOfBirth) : "Not provided"}
                      </Text>
                    </View>
                    <View className="flex-1 pl-2">
                      <Text className="text-[11px] font-medium text-gray-400">Enrolled On</Text>
                      <Text className="text-sm font-semibold text-gray-800 mt-0.5">
                        {formatDate(selectedChild.enrollmentDate)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Home Address Card */}
                <View className="rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
                  <View className="flex-row items-start gap-2.5">
                    <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg bg-teal-100/60">
                      <MapPin size={14} color="#0D9488" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] font-medium text-gray-400">
                        Home Address
                      </Text>
                      <Text className="text-sm font-medium text-gray-800 mt-0.5 leading-5">
                        {selectedChild.homeAddress?.trim() ? selectedChild.homeAddress : "No address provided"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ProfileSection>

            {/* ── Section 5: Teacher Contact ── */}
            {selectedChild.teacher ? (
              <ProfileSection
                icon={<User size={22} color="#047857" />}
                title="Teacher Contact"
                tone="emerald"
              >
                <View className="pt-2">
                  <View className="rounded-2xl bg-emerald-50/40 p-4 border border-emerald-100/80 mb-3">
                    <Text className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Assigned Teacher
                    </Text>
                    <Text className="text-base font-extrabold text-gray-900 mt-1">
                      {getTeacherFullName(selectedChild)}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {selectedChild.teacher.email || "No email available"}
                    </Text>
                  </View>

                  {/* Quick Contact Buttons */}
                  <View className="flex-row gap-2.5">
                    {selectedChild.teacher.phone?.trim() ? (
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${selectedChild.teacher?.phone}`)}
                        accessibilityRole="button"
                        accessibilityLabel="Call Teacher"
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 active:opacity-85"
                      >
                        <Phone size={16} color="white" />
                        <Text className="text-sm font-bold text-white">Call Teacher</Text>
                      </Pressable>
                    ) : null}

                    {selectedChild.teacher.email?.trim() ? (
                      <Pressable
                        onPress={() => Linking.openURL(`mailto:${selectedChild.teacher?.email}`)}
                        accessibilityRole="button"
                        accessibilityLabel="Email Teacher"
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 py-3 px-4 active:bg-gray-50"
                      >
                        <Mail size={16} color="#374151" />
                        <Text className="text-sm font-bold text-gray-700">Email</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </ProfileSection>
            ) : (
              <ProfileSection
                icon={<User size={22} color="#047857" />}
                title="Teacher Contact"
                tone="emerald"
              >
                <ProfileInfoRow
                  label="Status"
                  value="Not assigned yet"
                  valueTone="warning"
                  showDivider={false}
                />
              </ProfileSection>
            )}

            <GrowthHistoryBottomSheet
              childId={selectedChild._id}
              childName={getFullName(selectedChild)}
              visible={showGrowthHistory}
              onClose={() => setShowGrowthHistory(false)}
            />

            <CompetencyHistoryBottomSheet
              childId={selectedChild._id}
              childName={getFullName(selectedChild)}
              visible={showCompetencyHistory}
              onClose={() => setShowCompetencyHistory(false)}
            />

            <ViewGuardiansBottomSheet
              childId={selectedChild._id}
              childName={getFullName(selectedChild)}
              visible={showGuardians}
              onClose={() => setShowGuardians(false)}
              readOnly={true}
            />
          </>
        ) : null}
      </RefreshableScrollView>
    </ScreenShell>
  );
}

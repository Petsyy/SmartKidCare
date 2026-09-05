import type { ReactNode } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  HeartPulse,
  School,
  User,
  Users,
} from "lucide-react-native";
import type { Child } from "@/src/api/parent.api";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "@/src/components/ui";
import { useParentChildrenData } from "@/src/features/children/hooks";

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

function ProfileSection({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: "sky" | "emerald" | "teal" | "amber";
  children: ReactNode;
}) {
  const theme = {
    sky: {
      border: "border-sky-100",
      accent: "bg-sky-500",
      iconBackground: "bg-sky-50",
    },
    emerald: {
      border: "border-emerald-100",
      accent: "bg-emerald-500",
      iconBackground: "bg-emerald-50",
    },
    teal: {
      border: "border-teal-100",
      accent: "bg-teal-500",
      iconBackground: "bg-teal-50",
    },
    amber: {
      border: "border-amber-100",
      accent: "bg-amber-500",
      iconBackground: "bg-amber-50",
    },
  }[tone];

  return (
    <View
      className={`mb-4 overflow-hidden rounded-3xl border bg-white shadow-sm ${theme.border}`}
    >
      <View className={`h-1.5 rounded-t-3xl ${theme.accent}`} />
      <View className="p-4">
        <View className="flex-row items-center border-b border-gray-100 pb-3">
          <View
            className={`h-11 w-11 items-center justify-center rounded-2xl ${theme.iconBackground}`}
          >
            {icon}
          </View>
          <Text
            className="ml-3 flex-1 text-xl font-black text-gray-900"
            accessibilityRole="header"
          >
            {title}
          </Text>
        </View>
        <View>{children}</View>
      </View>
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
    ? "bg-emerald-50"
    : isNegative
      ? "bg-red-50"
      : "bg-gray-100";

  const textClass = isPositive
    ? "text-emerald-700"
    : isNegative
      ? "text-red-700"
      : "text-gray-600";

  const displayValue = isPositive
    ? normalizedStatus === "present"
      ? "Present"
      : "Completed"
    : isNegative
      ? normalizedStatus === "absent"
        ? "Absent"
        : "Missed"
      : "No update";

  const StatusIcon = isPositive
    ? CheckCircle2
    : isNegative
      ? AlertCircle
      : Clock3;

  const iconColor = isPositive ? "#047857" : isNegative ? "#DC2626" : "#6B7280";

  return (
    <View
      className="flex-1 flex-row items-center py-1"
      accessible
      accessibilityLabel={`${label}: ${displayValue}`}
    >
      <View
        className={`h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBackgroundClass}`}
      >
        <StatusIcon size={18} color={iconColor} />
      </View>
      <View className="ml-2 flex-1">
        <Text className="text-sm font-bold text-gray-500">{label}</Text>
        <Text className={`mt-0.5 text-base font-extrabold ${textClass}`}>
          {displayValue}
        </Text>
      </View>
    </View>
  );
}

// MAIN SCREEN
import { useRouter } from "expo-router";

export default function ParentChildrenScreen() {
  const router = useRouter();
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

  const nutritionStatus = selectedChild?.nutritionalStatus || NOT_PROVIDED;
  const nutritionTone =
    nutritionStatus.toLowerCase() === "normal"
      ? "success"
      : nutritionStatus === NOT_PROVIDED
        ? "default"
        : "warning";
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
        ...(selectedChild.studentId
          ? [{ label: "Student ID", value: selectedChild.studentId }]
          : []),
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
    <ScreenShell>
      <ScreenHeader
        backgroundVariant="brandGradient"
        title={screenTitle}
        subtitle={screenSubtitle}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: scrollBottomPadding + 24,
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
            <View className="mb-4 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <View
                accessible
                accessibilityLabel={`${getFullName(selectedChild)}. ${getChildDetails(selectedChild)}. ${enrollmentStatus?.label}`}
              >
                <Text
                  className="text-2xl font-black leading-8 text-gray-900"
                  numberOfLines={2}
                  accessibilityRole="header"
                >
                  {getFullName(selectedChild)}
                </Text>
                <View className="mt-2 flex-row flex-wrap items-center gap-2">
                  <Text className="text-base font-semibold text-gray-500">
                    {getChildDetails(selectedChild)}
                  </Text>
                  <View
                    className={`flex-row items-center rounded-full px-3 py-1 ${
                      enrollmentStatus?.isActive
                        ? "bg-emerald-50"
                        : "bg-gray-100"
                    }`}
                  >
                    {enrollmentStatus?.isActive ? (
                      <CircleCheck size={16} color="#047857" />
                    ) : null}
                    <Text
                      className={`text-base font-extrabold ${
                        enrollmentStatus?.isActive
                          ? "ml-1 text-emerald-700"
                          : "text-gray-600"
                      }`}
                    >
                      {enrollmentStatus?.label}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-4 border-t border-gray-100 pt-4">
                <Text className="text-base font-extrabold text-gray-900">
                  Today's Care
                </Text>
                <View className="mt-3 flex-row items-stretch">
                  <StatusPill label="Attendance" status={attendanceStatus} />
                  <View className="mx-3 w-px self-stretch bg-gray-100" />
                  <StatusPill label="Feeding" status={feedingStatus} />
                </View>
              </View>
            </View>

            {/* ── Section 1: School Information ── */}
            <ProfileSection
              icon={<School size={22} color="#0D9488" />}
              title="School Information"
              tone="teal"
            >
              <ProfileInfoRow
                label="Program"
                value={selectedChild.programType || NOT_PROVIDED}
              />
              <ProfileInfoRow
                label="School Year"
                value={selectedChild.schoolYear || NOT_PROVIDED}
              />
              <ProfileInfoRow
                label="Teacher"
                value={getTeacherFullName(selectedChild)}
                showDivider={false}
              />
            </ProfileSection>

            {/* ── Section 2: Health Information ── */}
            <ProfileSection
              icon={<HeartPulse size={22} color="#047857" />}
              title="Health Information"
              tone="emerald"
            >
              <ProfileInfoRow
                label="Weight"
                value={
                  selectedChild.weight
                    ? `${selectedChild.weight} kg`
                    : NOT_PROVIDED
                }
              />
              <ProfileInfoRow
                label="Height"
                value={
                  selectedChild.height
                    ? `${selectedChild.height} cm`
                    : NOT_PROVIDED
                }
              />
              <ProfileInfoRow
                label="BMI"
                value={
                  selectedChild.bmi
                    ? selectedChild.bmi.toString()
                    : NOT_PROVIDED
                }
              />
              <ProfileInfoRow
                label="Nutritional Status"
                value={nutritionStatus}
                valueTone={nutritionTone}
                showDivider={false}
              />
            </ProfileSection>

            {/* ── Section 3: Child Information ── */}
            <ProfileSection
              icon={<User size={22} color="#0D9488" />}
              title="Child Information"
              tone="teal"
            >
              {childInformationRows.map((row, index) => (
                <ProfileInfoRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  showDivider={index < childInformationRows.length - 1}
                />
              ))}
            </ProfileSection>

            {/* ── Section 4: Teacher Contact ── */}
            {selectedChild.teacher ? (
              <ProfileSection
                icon={<User size={22} color="#047857" />}
                title="Teacher Contact"
                tone="emerald"
              >
                <ProfileInfoRow
                  label="Email"
                  value={selectedChild.teacher.email || "Not available"}
                />
                <ProfileInfoRow
                  label="Contact Number"
                  value={
                    selectedChild.teacher.phone?.trim()
                      ? selectedChild.teacher.phone
                      : "Not available"
                  }
                  showDivider={false}
                />
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

            {/* ── Section 5: ECCD Assessment ── */}
            <ProfileSection
              icon={<ClipboardCheck size={22} color="#0284C7" />}
              title="ECCD Assessment"
              tone="sky"
            >
              <View className="pt-2 pb-1">
                <Text className="mb-4 text-base leading-6 text-gray-600">
                  Track your child's developmental progress across 6 domains (Gross Motor, Fine Motor, Cognitive, Language, Socio-Emotional, Self-Help).
                </Text>
                <Pressable
                  onPress={() => router.push(`/(parent)/competencies/${selectedChild._id}?isParentView=true`)}
                  className="min-h-12 flex-row items-center justify-center rounded-2xl bg-sky-600 px-4 active:bg-sky-700"
                  accessibilityRole="button"
                  accessibilityLabel="View competency evaluation checklist"
                >
                  <ClipboardCheck size={20} color="#FFFFFF" />
                  <Text className="ml-2 text-base font-bold text-white">View Evaluation</Text>
                </Pressable>
              </View>
            </ProfileSection>
          </>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

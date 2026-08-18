import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, } from "react-native";
import { useRouter } from "expo-router";
import * as Icons from "lucide-react-native";
import { useParentChildrenData } from "@/src/features/children/hooks";
import type { Child } from "@/src/api/parent.api";
import { StatusRow, ProgressMetric, QuickActionRow, } from "@/src/features/children/components/parent-children-metrics";
import { ScreenShell, ScreenHeader } from "@/src/components/ui";

const getFullName = (child: Child): string => {
  const middle = child.middleName ? ` ${child.middleName}` : "";
  return `${child.firstName}${middle} ${child.lastName}`
    .replace(/\s+/g, " ")
    .trim();
};

export default function ParentChildrenScreen() {
  const {
    children,
    selectedChild,
    setSelectedChildId,
    loading,
    refreshing,
    error,
    loadScreenData,
    onRefresh,
    childStatus,
    monthlySummary,
    scrollBottomPadding,
  } = useParentChildrenData();
  const router = useRouter();

  const monthLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    timeZone: "Asia/Manila",
  }).format(new Date());

  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          title="My Children"
          subtitle="Children linked to your account"
        />

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F766E" />
          <Text className="mt-4 text-base font-medium text-gray-600">
            Please wait...
          </Text>
        </View>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          title="My Children"
          subtitle="Children linked to your account"
        />

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
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        title="My Children"
        subtitle="Children linked to your account"
      />

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
              <Icons.Users size={24} color="#0D9488" />
            </View>
            <Text className="mt-4 text-2xl font-bold text-gray-900">
              No linked children yet
            </Text>
            <Text className="mt-3 text-base leading-7 text-gray-600">
              Your child will appear here once their teacher completes enrollment.
              Contact your daycare center if you believe your child should be listed.
            </Text>
          </View>
        ) : (
          <>
            {children.length > 1 ? (
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold uppercase tracking-wide text-gray-500">
                  Your Children ({children.length})
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
                        className={`mr-3 rounded-full border px-5 py-2.5 ${isActive
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
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-teal-600">
                      <Text className="text-2xl font-bold text-white">
                        {selectedChild.firstName.charAt(0)}{selectedChild.lastName.charAt(0)}
                      </Text>
                    </View>

                    <View className="ml-3 flex-1">
                      <Text
                        className="text-2xl font-black text-gray-900"
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

                <View className={`mt-4 rounded-2xl border p-4 ${
                  childStatus.tone === "good"
                    ? "border-emerald-200 bg-emerald-50"
                    : childStatus.tone === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : "border-gray-100 bg-gray-50"
                }`}>
                  <Text className={`text-lg font-bold ${
                    childStatus.tone === "good"
                      ? "text-emerald-800"
                      : childStatus.tone === "warning"
                        ? "text-amber-800"
                        : "text-gray-700"
                  }`}>
                    Today's Status
                  </Text>

                  <View className="mt-3 gap-2">
                    <StatusRow
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
                    <StatusRow
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

                  <Text className="mt-3 text-sm font-semibold text-gray-500">
                    Last update: {childStatus.lastUpdated}
                  </Text>
                </View>
              </Pressable>
            ) : null}



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
    </ScreenShell>
  );
}


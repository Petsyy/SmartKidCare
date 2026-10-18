import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { ChevronDown, Search, CheckCircle2 } from "lucide-react-native";
import { memo, useCallback } from "react";
import { useTeacherFeeding } from "@/src/features/feeding/hooks";
import { FeedingDatePicker } from "@/src/features/feeding/components/feeding-date-picker";
import type { Child } from "@/src/api/parent.api";
import { useUnsavedChangesGuard } from "@/src/hooks/use-unsaved-changes-guard";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  SearchBar,
  SuccessFeedbackModal,
} from "@/src/components/ui";
import { useAndroidBackRoute } from "@/src/hooks/use-android-back-route";

const FeedingChildRow = memo(function FeedingChildRow({
  child,
}: {
  child: Child;
}) {
  return (
    <View
      className="mx-6 mb-3 flex-row items-center rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm"
      accessible
      accessibilityLabel={`${child.lastName}, ${child.firstName}, included as completed`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Text className="font-bold text-slate-700">
          {child.firstName.charAt(0)}
          {child.lastName.charAt(0)}
        </Text>
      </View>
      <Text
        className="ml-3 min-w-0 flex-1 text-base font-bold text-gray-900"
        numberOfLines={2}
      >
        {child.lastName}, {child.firstName}
        {child.middleName ? ` ${child.middleName}` : ""}
      </Text>
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
        <CheckCircle2 size={24} color="#059669" />
      </View>
    </View>
  );
});

export default function RecordFeeding() {
  const {
    router,
    children,
    loading,
    foodServed,
    setFoodServed,
    searchQuery,
    setSearchQuery,
    showMenuModal,
    setShowMenuModal,
    showSuccessFeedback,
    dismissSuccessFeedback,
    isReadOnly,
    isSubmitting,
    attendanceDateKey,
    setAttendanceDateKey,
    attendanceDateLabel,
    feedingDateOptions,
    attendancePrerequisiteMet,
    interactionDisabled,
    filteredChildren,
    stats,
    hasUnsavedChanges,
    handleSubmit,
    openAttendanceForSelectedDate,
    submitBeforeLeaving,
    foodMenuOptions,
    isOffline,
  } = useTeacherFeeding();
  useAndroidBackRoute("/(teacher)");
  const completedPercentage = stats.total > 0 ? 100 : 0;

  useUnsavedChangesGuard({
    hasUnsavedChanges,
    isSaving: isSubmitting,
    onSave: submitBeforeLeaving,
    fallbackRoute: "/(teacher)",
    saveLabel: "Save Draft",
    message:
      "You have unsaved feeding progress. Save it securely as a draft before leaving?",
  });

  const renderChildCard = useCallback(
    ({ item: child }: { item: Child }) => <FeedingChildRow child={child} />,
    [],
  );

  const headerSection = (
    <>
      <FeedingDatePicker
        dateKey={attendanceDateKey}
        dateLabel={attendanceDateLabel}
        dateOptions={feedingDateOptions}
        onDateChange={setAttendanceDateKey}
      />

      <View className="px-6 pb-5 pt-2">
        {isReadOnly ? (
          <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <Text className="text-base font-bold text-emerald-900">
              Feeding finalized
            </Text>
            <Text className="mt-1 text-sm text-emerald-800">
              This record is read-only.
            </Text>
          </View>
        ) : null}

        <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text
                className="text-xl font-extrabold text-gray-900"
                accessibilityRole="header"
              >
                Feeding overview
              </Text>
              <Text className="mt-1 text-base text-gray-600">
                Present children are included as completed
              </Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Text className="text-2xl font-extrabold text-slate-800">
                {stats.total}
              </Text>
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total
              </Text>
            </View>
          </View>

          <View className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
            <View
              className="h-full rounded-full bg-emerald-600"
              style={{
                width: `${completedPercentage}%` as `${number}%`,
              }}
            />
          </View>

          <View className="mt-4 flex-row items-center rounded-2xl bg-emerald-50 p-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 size={22} color="#047857" />
            </View>
            <Text className="ml-3 flex-1 text-base font-semibold text-emerald-800">
              {stats.fed} {stats.fed === 1 ? "child" : "children"}{" "}
              {isReadOnly ? "completed" : "ready for feeding submission"}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 pb-5">
        <Text className="mb-2 text-lg font-medium text-gray-700">
          Food Served (Menu) {!isReadOnly && <Text className="text-red-500">*</Text>}
        </Text>
        <Pressable
          onPress={() => !interactionDisabled && setShowMenuModal(true)}
          disabled={interactionDisabled}
          accessibilityRole="button"
          accessibilityLabel={
            foodServed ? `Food served: ${foodServed}` : "Select food menu"
          }
          accessibilityHint={
            interactionDisabled
              ? "Submitted feeding records cannot be changed"
              : "Opens the food menu options"
          }
          accessibilityState={{ disabled: interactionDisabled }}
          className={`min-h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm ${
            interactionDisabled ? "opacity-75" : "active:bg-gray-50"
          }`}
        >
          <Text
            className={`flex-1 text-lg font-medium ${
              foodServed ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {foodServed || "Select food menu"}
          </Text>
          {!interactionDisabled && <ChevronDown size={20} color="#9CA3AF" />}
        </Pressable>
      </View>

      <View className="px-6 pb-3">
        <Text
          className="text-xl font-extrabold text-gray-900"
          accessibilityRole="header"
        >
          Feeding list
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by child name"
      />
    </>
  );

  if (loading) {
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Record Feeding"
          onBack={() => router.replace("/(teacher)")}
        />
        <ScreenLoadingState
          title="Loading feeding records"
          message="Getting your class meal list ready."
        />
      </ScreenShell>
    );
  }

  if (children.length === 0) {
    const attendanceMissing = !attendancePrerequisiteMet;
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Record Feeding"
          subtitle={attendanceDateLabel}
          onBack={() => router.replace("/(teacher)")}
        />
        <FeedingDatePicker
          dateKey={attendanceDateKey}
          dateLabel={attendanceDateLabel}
          dateOptions={feedingDateOptions}
          onDateChange={setAttendanceDateKey}
        />
        <View className="flex-1 items-center justify-center px-6">
          <CheckCircle2 size={64} color="#D1D5DB" />
          <Text className="mt-4 text-2xl font-bold text-gray-800">
            {attendanceMissing ? "Attendance Required" : "No Present Children"}
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            {attendanceMissing
              ? `Submit attendance for ${attendanceDateLabel} before recording feeding.`
              : `Attendance for ${attendanceDateLabel} has no children marked present.`}
          </Text>
          {attendanceMissing ? (
            <Pressable
              onPress={openAttendanceForSelectedDate}
              accessibilityRole="button"
              accessibilityLabel={`Record attendance for ${attendanceDateLabel}`}
              accessibilityHint="Opens attendance and returns to feeding after submission"
              className="mt-6 min-h-14 items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 active:opacity-90"
            >
              <Text className="text-lg font-bold text-white">
                Record Attendance
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Record Feeding"
        subtitle={attendanceDateLabel}
        onBack={() => router.replace("/(teacher)")}
      />

      <FlatList
        data={filteredChildren}
        keyExtractor={(item) => item._id}
        renderItem={renderChildCard}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={headerSection}
        ListEmptyComponent={
          searchQuery ? (
            <View className="mx-6 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-10">
              <Search size={48} color="#D1D5DB" />
              <Text className="mt-4 text-xl font-semibold text-gray-700">
                No child found
              </Text>
              <Text className="mt-2 text-center text-gray-500">
                Try searching with a different name
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View className="px-6 pb-4">
            <View className="mt-2 flex-row items-start rounded-2xl border border-teal-200 bg-teal-50 p-3.5">
              <CheckCircle2 size={16} color="#14B8A6" className="mt-0.5" />
              <Text className="ml-2 flex-1 text-base text-gray-700">
                Feeding records are teacher-observed, securely stored, and sent
                to the focal person for review.
              </Text>
            </View>
          </View>
        }
      />

      <SuccessFeedbackModal
        visible={showSuccessFeedback}
        title="Feeding Submitted"
        message="Feeding report has been submitted successfully."
        onDismiss={dismissSuccessFeedback}
        accessibilityLabel="Feeding submission confirmation"
      />

      <Modal
        visible={showMenuModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View
          className="flex-1 justify-end bg-black/50"
          accessibilityViewIsModal
          accessibilityLabel="Food menu options"
        >
          <View className="rounded-t-3xl bg-white">
            <View className="border-b border-gray-200 p-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-800">
                  Select Food Menu
                </Text>
                <Pressable
                  onPress={() => setShowMenuModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close food menu"
                  className="min-h-12 justify-center px-2"
                >
                  <Text className="text-lg font-semibold text-teal-600">
                    Close
                  </Text>
                </Pressable>
              </View>
            </View>
            <View className="max-h-96">
              <FlatList
                data={foodMenuOptions}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item: food }) => (
                  <Pressable
                    onPress={() => {
                      setFoodServed(food);
                      setShowMenuModal(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${food}`}
                    accessibilityState={{ selected: foodServed === food }}
                    className={`border-b px-6 py-4 active:bg-gray-50 ${
                      foodServed === food
                        ? "border-teal-100 bg-teal-50"
                        : "border-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-lg ${
                        foodServed === food
                          ? "font-semibold text-teal-700"
                          : "text-gray-800"
                      }`}
                    >
                      {food}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>

      {!isReadOnly ? (
        <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-gray-200 bg-white/95 px-6 py-4">
          <Pressable
            onPress={() =>
              void submitBeforeLeaving().then(() =>
                router.replace("/(teacher)"),
              )
            }
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Save feeding draft and leave"
            accessibilityState={{ disabled: isSubmitting }}
            className={`min-h-14 flex-1 items-center justify-center rounded-2xl border px-3 shadow-sm ${
              isSubmitting
                ? "border-gray-300 bg-gray-100"
                : "border-teal-600 bg-white active:bg-teal-50"
            }`}
          >
            <Text
              className={`text-center font-bold ${
                isSubmitting ? "text-gray-400" : "text-teal-700"
              }`}
            >
              Save Draft
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert(
                "Submit Feeding",
                "Are you sure you want to submit the feeding record?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: isOffline ? "Submit Offline" : "Submit",
                    onPress: handleSubmit,
                  },
                ],
              );
            }}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={
              isSubmitting
                ? "Submitting feeding record"
                : "Submit feeding record"
            }
            accessibilityHint={
              "Submits today's feeding record to the focal person"
            }
            accessibilityState={{
              disabled: isSubmitting,
              busy: isSubmitting,
            }}
            android_ripple={{ color: "transparent" }}
            className={`min-h-14 flex-[1.65] items-center justify-center rounded-2xl px-3 shadow-sm ${
              isSubmitting
                ? "bg-emerald-400"
                : "bg-emerald-600 active:opacity-90"
            }`}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isSubmitting && (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text className="text-center text-base font-bold text-white">
                {isSubmitting
                  ? "Submitting..."
                  : isOffline
                    ? "Submit Offline"
                    : "Submit Feeding Record"}
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </ScreenShell>
  );
}

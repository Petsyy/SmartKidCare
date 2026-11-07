import { useCallback } from "react";
import { View, Text, FlatList } from "react-native";
import { Search, CheckCircle2 } from "lucide-react-native";
import { useTeacherFeeding } from "@/src/features/feeding/hooks";
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
import {
  FeedingDatePicker,
  FeedingChildRow,
  FeedingOverviewCard,
  FeedingMenuPickerButton,
  FeedingMenuModal,
  FeedingBottomBar,
  FeedingPrerequisiteEmptyState,
} from "@/src/features/feeding/components";

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

        <FeedingOverviewCard
          total={stats.total}
          fed={stats.fed}
          isReadOnly={isReadOnly}
        />
      </View>

      <FeedingMenuPickerButton
        foodServed={foodServed}
        isReadOnly={isReadOnly}
        disabled={interactionDisabled}
        onPress={() => setShowMenuModal(true)}
      />

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
        <FeedingPrerequisiteEmptyState
          attendanceMissing={!attendancePrerequisiteMet}
          attendanceDateLabel={attendanceDateLabel}
          onRecordAttendance={openAttendanceForSelectedDate}
        />
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

      <FeedingMenuModal
        visible={showMenuModal}
        foodMenuOptions={foodMenuOptions}
        selectedFood={foodServed}
        onClose={() => setShowMenuModal(false)}
        onSelectFood={setFoodServed}
      />

      <FeedingBottomBar
        isReadOnly={isReadOnly}
        isSubmitting={isSubmitting}
        isOffline={isOffline}
        onSaveDraft={() =>
          void submitBeforeLeaving().then(() => router.replace("/(teacher)"))
        }
        onSubmit={handleSubmit}
      />
    </ScreenShell>
  );
}

import { useCallback } from "react";
import { FlatList, Text, View } from "react-native";
import type { Child } from "@/src/api/api.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTeacherAttendance } from "@/src/features/attendance/hooks/useTeacherAttendance";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  SuccessFeedbackModal,
} from "@/src/components/ui";
import { useAndroidBackRoute } from "@/src/hooks/use-android-back-route";
import {
  AttendanceDatePicker,
  AttendanceChildRow,
  AttendanceFinalizedBanner,
  AttendanceOverviewCard,
  AttendanceFilterBar,
  AttendanceQuickActionBar,
  AttendanceBottomBar,
  AttendanceExcuseModal,
  AttendanceEmptyState,
} from "@/src/features/attendance/components";

export default function RecordAttendance() {
  const state = useTeacherAttendance();
  const insets = useSafeAreaInsets();
  useAndroidBackRoute(state.backRoute);

  const renderChildRow = useCallback(
    ({ item }: { item: Child }) => (
      <AttendanceChildRow
        child={item}
        selection={state.attendance[item._id]}
        editable={state.editable}
        onSetStatus={state.setStatus}
      />
    ),
    [state.attendance, state.editable, state.setStatus],
  );

  if (state.loading) {
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Record Attendance"
          onBack={() => state.router.replace(state.backRoute)}
        />
        <ScreenLoadingState
          title="Loading attendance"
          message="Getting your class attendance list ready."
        />
      </ScreenShell>
    );
  }

  const listHeader = (
    <View className="pt-1">
      <AttendanceDatePicker
        dateKey={state.selectedDateKey}
        dateLabel={state.selectedDateLabel}
        onDateChange={state.setSelectedDateKey}
        disabled={state.isEditing}
      />

      <View className="pb-4 pt-2">
        {state.isReadOnly ? (
          <AttendanceFinalizedBanner
            isEditing={state.isEditing}
            canEditFinalized={state.canEditFinalized}
            onStartEditing={state.startEditing}
          />
        ) : null}

        <AttendanceOverviewCard
          stats={state.stats}
          onReviewUnmarked={() => state.setFilter("unmarked")}
        />

        <AttendanceFilterBar
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
          filter={state.filter}
          onSelectFilter={state.setFilter}
          unmarkedCount={state.stats.unmarked}
        />

        {state.editable && state.stats.unmarked > 0 ? (
          <AttendanceQuickActionBar
            unmarkedCount={state.stats.unmarked}
            onMarkAllUnmarkedPresent={state.markAllUnmarkedPresent}
          />
        ) : null}

        <View className="mx-6 mt-5 flex-row items-end justify-between">
          <View>
            <Text
              className="text-xl font-extrabold text-gray-900"
              accessibilityRole="header"
            >
              {state.filter === "unmarked"
                ? `Needs attention (${state.stats.unmarked})`
                : "Class list"}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-500">
              Showing {state.filteredChildren.length} of {state.stats.total} children
            </Text>
          </View>
          <Text className="text-sm font-semibold text-gray-500">A–Z</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Record Attendance"
        subtitle={state.selectedDateLabel}
        onBack={() => state.router.replace(state.backRoute)}
      />

      <FlatList
        data={state.filteredChildren}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<AttendanceEmptyState />}
        contentContainerStyle={{
          paddingBottom: state.editable ? 104 + insets.bottom : 24,
        }}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        renderItem={renderChildRow}
      />

      {state.editable ? (
        <AttendanceBottomBar
          isEditing={state.isEditing}
          isReadOnly={state.isReadOnly}
          isSubmitting={state.isSubmitting}
          stats={state.stats}
          changeSummary={state.changeSummary}
          insetsBottom={insets.bottom}
          onCancelEditing={state.cancelEditing}
          onSaveDraft={() => void state.saveDraftAndLeave()}
          onSubmit={() => void state.handleSubmit()}
          onReviewUnmarked={() => state.setFilter("unmarked")}
        />
      ) : null}

      <AttendanceExcuseModal
        visible={Boolean(state.excuseEditor)}
        excuseEditor={state.excuseEditor}
        onSelectReason={(reason) =>
          state.setExcuseEditor((current) =>
            current ? { ...current, reason } : null,
          )
        }
        onChangeNotes={(notes) =>
          state.setExcuseEditor((current) =>
            current ? { ...current, notes } : null,
          )
        }
        onCancel={() => state.setExcuseEditor(null)}
        onConfirm={state.confirmExcused}
      />

      <SuccessFeedbackModal
        visible={state.showSuccessFeedback}
        title={
          state.successWasEdit ? "Attendance Updated" : "Attendance Submitted"
        }
        message="Attendance was saved successfully."
        onDismiss={state.dismissSuccessFeedback}
        accessibilityLabel="Attendance save confirmation"
      />
    </ScreenShell>
  );
}

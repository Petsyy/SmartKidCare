import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { memo, useCallback } from "react";
import { Check, CheckCircle2, Users } from "lucide-react-native";
import type { Child } from "@/src/api/api.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AttendanceDatePicker } from "@/src/features/attendance/components/attendance-date-picker";
import {
  type AttendanceFilter,
  type AttendanceSelection,
  type AttendanceStatus,
  type ExcuseReason,
  useTeacherAttendance,
} from "@/src/features/attendance/hooks/useTeacherAttendance";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  SearchBar,
  SuccessFeedbackModal,
} from "@/src/components/ui";
import { useAndroidBackRoute } from "@/src/hooks/use-android-back-route";
import { formatChildRosterName } from "@/src/utils/child-name";

const STATUS_STYLE = {
  present: {
    letter: "P",
    label: "Present",
    selected: "bg-emerald-600 border-emerald-600",
  },
  absent: {
    letter: "A",
    label: "Absent",
    selected: "bg-red-600 border-red-600",
  },
  excused: {
    letter: "E",
    label: "Excused",
    selected: "bg-amber-500 border-amber-500",
  },
} as const;

const REASONS: { value: ExcuseReason; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "medical_appointment", label: "Medical appointment" },
  { value: "family_emergency", label: "Family emergency" },
  { value: "other", label: "Other" },
];

interface AttendanceChildRowProps {
  child: Child;
  selection?: AttendanceSelection;
  editable: boolean;
  onSetStatus: (childId: string, status: AttendanceStatus) => void;
}

const AttendanceChildRow = memo(function AttendanceChildRow({
  child,
  selection,
  editable,
  onSetStatus,
}: AttendanceChildRowProps) {
  return (
    <View
      className={`mx-6 mb-3 rounded-2xl border bg-white p-3 shadow-sm ${
        selection?.status === "present"
          ? "border-emerald-300"
          : selection?.status === "absent"
            ? "border-red-300"
            : selection?.status === "excused"
              ? "border-amber-300"
              : "border-gray-200"
      }`}
    >
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Text className="font-bold text-slate-700">
            {child.firstName[0]}
            {child.lastName[0]}
          </Text>
        </View>
        <View className="ml-3 min-w-0 flex-1 pr-2">
          <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
            {formatChildRosterName(child)}
          </Text>
        </View>
        <View className="flex-row gap-1">
          {(Object.keys(STATUS_STYLE) as AttendanceStatus[]).map((status) => {
            const style = STATUS_STYLE[status];
            const selected = selection?.status === status;
            return (
              <Pressable
                key={status}
                onPress={() => onSetStatus(child._id, status)}
                disabled={!editable}
                accessibilityRole="button"
                accessibilityLabel={`Mark ${formatChildRosterName(child)} ${style.label.toLowerCase()}`}
                accessibilityState={{ selected, disabled: !editable }}
                className={`h-11 w-11 items-center justify-center rounded-xl border ${selected ? style.selected : "border-gray-300 bg-white"} ${!editable ? "opacity-60" : ""}`}
              >
                <Text
                  className={`text-base font-extrabold ${selected ? "text-white" : "text-gray-700"}`}
                >
                  {style.letter}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
});

export default function RecordAttendance() {
  const state = useTeacherAttendance();
  const insets = useSafeAreaInsets();
  useAndroidBackRoute(state.backRoute);
  const markedCount =
    state.stats.present + state.stats.absent + state.stats.excused;
  const markedPercentage =
    state.stats.total > 0
      ? Math.round((markedCount / state.stats.total) * 100)
      : 0;
  const filters: { value: AttendanceFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unmarked", label: `Unmarked ${state.stats.unmarked}` },
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "excused", label: "Excused" },
  ];
  const confirmQuickAttendance = () => {
    Alert.alert(
      "Mark unmarked children Present?",
      `This will mark all ${state.stats.unmarked} unmarked ${state.stats.unmarked === 1 ? "child" : "children"} in the class as Present. Existing statuses will not change.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Present",
          onPress: state.markAllUnmarkedPresent,
        },
      ],
    );
  };
  const header = (
    <View className="pt-1">
      <AttendanceDatePicker
        dateKey={state.selectedDateKey}
        dateLabel={state.selectedDateLabel}
        onDateChange={state.setSelectedDateKey}
        disabled={state.isEditing}
      />

      <View className="pb-4 pt-2">
        {state.isReadOnly ? (
          <View className="mx-6 mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <Text className="text-base font-bold text-emerald-900">
              {state.isEditing
                ? "Editing finalized attendance"
                : "Attendance finalized"}
            </Text>
            <Text className="mt-1 text-sm text-emerald-800">
              {state.isEditing
                ? "Review every change before saving."
                : state.canEditFinalized
                  ? "You can correct this record until the end of today."
                  : "This record is read-only."}
            </Text>
            {!state.isEditing && state.canEditFinalized ? (
              <Pressable
                onPress={state.startEditing}
                accessibilityRole="button"
                accessibilityLabel="Edit finalized attendance"
                className="mt-3 min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4"
              >
                <Text className="font-bold text-white">Edit Attendance</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="mx-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="text-lg font-extrabold text-gray-900"
                accessibilityRole="header"
              >
                Attendance overview
              </Text>
              <Text className="mt-0.5 text-sm text-gray-600">
                {markedCount} of {state.stats.total} children marked
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-extrabold text-teal-700">
                {markedPercentage}%
              </Text>
              <Text className="text-xs font-semibold text-gray-500">
                complete
              </Text>
            </View>
          </View>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <View
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${markedPercentage}%` as `${number}%` }}
            />
          </View>
          <View className="mt-3 flex-row gap-2">
            {[
              ["Present", state.stats.present, "bg-emerald-50", "text-emerald-800"],
              ["Absent", state.stats.absent, "bg-red-50", "text-red-800"],
              ["Excused", state.stats.excused, "bg-amber-50", "text-amber-800"],
            ].map(([label, value, background, color]) => (
              <View
                key={String(label)}
                className={`flex-1 rounded-xl px-3 py-2.5 ${background}`}
              >
                <Text className={`text-lg font-extrabold ${color}`}>
                  {value}
                </Text>
                <Text className={`text-xs font-semibold ${color}`} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => state.setFilter("unmarked")}
            disabled={state.stats.unmarked === 0}
            accessibilityRole="button"
            accessibilityLabel={`${state.stats.unmarked} unmarked children. Show unmarked children.`}
            accessibilityState={{ disabled: state.stats.unmarked === 0 }}
            className={`mt-3 min-h-11 flex-row items-center justify-between rounded-xl px-3 ${state.stats.unmarked > 0 ? "bg-amber-50" : "bg-emerald-50"}`}
            accessibilityLiveRegion="polite"
          >
            <Text className={`text-sm font-bold ${state.stats.unmarked > 0 ? "text-amber-800" : "text-emerald-800"}`}>
              {state.stats.unmarked > 0
                ? `${state.stats.unmarked} still need a status`
                : "All children are marked"}
            </Text>
            {state.stats.unmarked > 0 ? (
              <Text className="text-sm font-bold text-amber-800">Review</Text>
            ) : (
              <CheckCircle2 size={18} color="#047857" />
            )}
          </Pressable>
        </View>

        <SearchBar
          value={state.searchQuery}
          onChangeText={state.setSearchQuery}
          placeholder="Search by child name"
          containerClassName="mx-6 mb-2 mt-4"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-6"
          accessibilityRole="tablist"
        >
          {filters.map((item) => {
            const selected = state.filter === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => state.setFilter(item.value)}
                accessibilityRole="tab"
                accessibilityLabel={`Filter attendance by ${item.label}`}
                accessibilityState={{ selected }}
                className={`min-h-11 justify-center rounded-full border px-4 ${
                  selected
                    ? "border-teal-700 bg-teal-700"
                    : item.value === "unmarked" && state.stats.unmarked > 0
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-300 bg-white"
                }`}
              >
                <Text className={`font-semibold ${selected ? "text-white" : "text-gray-700"}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {state.editable && state.stats.unmarked > 0 ? (
          <View className="mx-6 mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-base font-extrabold text-teal-950">Quick attendance</Text>
                <Text className="mt-0.5 text-sm text-teal-800">
                  Existing statuses will not be changed.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={confirmQuickAttendance}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${state.stats.unmarked} unmarked children as Present`}
              className="mt-3 min-h-12 flex-row items-center justify-center rounded-xl bg-teal-700 px-4 active:opacity-90"
            >
              <Check size={18} color="#FFFFFF" />
              <Text className="ml-2 text-center font-bold text-white">
                Mark {state.stats.unmarked} Unmarked as Present
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="mx-6 mt-5 flex-row items-end justify-between">
          <View>
            <Text className="text-xl font-extrabold text-gray-900" accessibilityRole="header">
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
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View className="mx-6 items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10">
            <Users size={44} color="#D1D5DB" />
            <Text className="mt-3 text-center text-base font-semibold text-gray-600">
              No children match this filter
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Try another status or search term.
            </Text>
          </View>
        }
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
        <View
          className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-gray-200 bg-white/95 px-6 pt-4 shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {state.isEditing ? (
            <Pressable
              onPress={state.cancelEditing}
              className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-gray-400 bg-white px-3"
              accessibilityRole="button"
              accessibilityLabel="Cancel attendance changes"
            >
              <Text className="text-center font-bold text-gray-700">
                Cancel
              </Text>
            </Pressable>
          ) : !state.isReadOnly ? (
            <Pressable
              onPress={() => void state.saveDraftAndLeave()}
              disabled={state.isSubmitting}
              className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-teal-600 bg-white px-3"
              accessibilityRole="button"
              accessibilityLabel="Save attendance draft"
            >
              <Text className="text-center font-bold text-teal-700">
                Save Draft
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              if (state.stats.unmarked > 0) {
                state.setFilter("unmarked");
                return;
              }
              Alert.alert(
                state.isEditing
                  ? "Save Attendance Changes"
                  : "Finalize Attendance",
                state.isEditing
                  ? state.changeSummary.length
                    ? `Confirm these changes:\n\n${state.changeSummary.slice(0, 6).join("\n")}${state.changeSummary.length > 6 ? `\n…and ${state.changeSummary.length - 6} more` : ""}`
                    : "No attendance status changes were made."
                  : `Finalize attendance with ${state.stats.present} present, ${state.stats.absent} absent, and ${state.stats.excused} excused?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: state.isEditing ? "Save Changes" : "Finalize",
                    onPress: () => void state.handleSubmit(),
                  },
                ],
              );
            }}
            disabled={
              state.isSubmitting ||
              (state.stats.unmarked === 0 &&
                state.isEditing &&
                state.changeSummary.length === 0)
            }
            accessibilityRole="button"
            accessibilityLabel={
              state.stats.unmarked > 0
                ? `Review ${state.stats.unmarked} unmarked ${state.stats.unmarked === 1 ? "child" : "children"}`
                : state.isEditing
                  ? "Save attendance changes"
                  : "Finalize attendance"
            }
            accessibilityHint={
              state.stats.unmarked > 0
                ? "Shows the children who still need an attendance status"
                : undefined
            }
            accessibilityState={{
              disabled:
                state.isSubmitting ||
                (state.stats.unmarked === 0 &&
                  state.isEditing &&
                  state.changeSummary.length === 0),
              busy: state.isSubmitting,
            }}
            className={`min-h-14 flex-[1.65] items-center justify-center rounded-2xl px-3 ${state.stats.unmarked > 0 ? "bg-amber-500" : state.isEditing && state.changeSummary.length === 0 ? "bg-gray-300" : "bg-emerald-600"}`}
          >
            {state.isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-base font-bold text-white">
                {state.stats.unmarked > 0
                  ? `Review ${state.stats.unmarked} Unmarked`
                  : state.isEditing
                    ? state.changeSummary.length
                      ? "Save Changes"
                      : "No Changes"
                    : "Finalize Attendance"}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={Boolean(state.excuseEditor)}
        transparent
        animationType="fade"
        onRequestClose={() => state.setExcuseEditor(null)}
      >
        <View className="flex-1 justify-center bg-black/40 px-5">
          <View className="rounded-3xl bg-white p-5">
            <Text className="text-xl font-bold text-gray-900">
              Excused reason
            </Text>
            <Text className="mt-1 text-sm text-gray-600">
              Choose a reason before marking this child Excused.
            </Text>
            <View className="mt-4 gap-2">
              {REASONS.map((reason) => (
                <Pressable
                  key={reason.value}
                  onPress={() =>
                    state.setExcuseEditor((current) =>
                      current ? { ...current, reason: reason.value } : null,
                    )
                  }
                  className={`min-h-12 justify-center rounded-xl border px-4 ${state.excuseEditor?.reason === reason.value ? "border-amber-500 bg-amber-50" : "border-gray-300"}`}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: state.excuseEditor?.reason === reason.value,
                  }}
                >
                  <Text className="font-semibold text-gray-800">
                    {reason.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {state.excuseEditor?.reason === "other" ? (
              <TextInput
                value={state.excuseEditor.notes}
                onChangeText={(notes) =>
                  state.setExcuseEditor((current) =>
                    current ? { ...current, notes } : null,
                  )
                }
                placeholder="Enter a short reason"
                maxLength={250}
                multiline
                className="mt-3 min-h-20 rounded-xl border border-gray-300 px-3 py-2 text-base text-gray-900"
                accessibilityLabel="Other excused reason"
              />
            ) : null}
            <View className="mt-5 flex-row gap-2">
              <Pressable
                onPress={() => state.setExcuseEditor(null)}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-gray-300"
                accessibilityRole="button"
              >
                <Text className="font-bold text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!state.confirmExcused())
                    Alert.alert(
                      "Reason required",
                      state.excuseEditor?.reason === "other"
                        ? "Enter a short reason."
                        : "Choose an excused reason.",
                    );
                }}
                className="min-h-12 flex-1 items-center justify-center rounded-xl bg-amber-500"
                accessibilityRole="button"
              >
                <Text className="font-bold text-white">Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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

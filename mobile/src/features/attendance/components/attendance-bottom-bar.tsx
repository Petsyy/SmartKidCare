import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import type { TeacherAttendanceStats } from "@/src/features/attendance/types";

interface AttendanceBottomBarProps {
  isEditing: boolean;
  isReadOnly: boolean;
  isSubmitting: boolean;
  stats: TeacherAttendanceStats;
  changeSummary: string[];
  insetsBottom: number;
  onCancelEditing: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onReviewUnmarked: () => void;
}

export function AttendanceBottomBar({
  isEditing,
  isReadOnly,
  isSubmitting,
  stats,
  changeSummary,
  insetsBottom,
  onCancelEditing,
  onSaveDraft,
  onSubmit,
  onReviewUnmarked,
}: AttendanceBottomBarProps) {
  const handlePrimaryPress = () => {
    if (stats.unmarked > 0) {
      onReviewUnmarked();
      return;
    }

    Alert.alert(
      isEditing ? "Save Attendance Changes" : "Finalize Attendance",
      isEditing
        ? changeSummary.length
          ? `Confirm these changes:\n\n${changeSummary.slice(0, 6).join("\n")}${
              changeSummary.length > 6
                ? `\n…and ${changeSummary.length - 6} more`
                : ""
            }`
          : "No attendance status changes were made."
        : `Finalize attendance with ${stats.present} present, ${stats.absent} absent, and ${stats.excused} excused?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isEditing ? "Save Changes" : "Finalize",
          onPress: onSubmit,
        },
      ],
    );
  };

  const isPrimaryDisabled =
    isSubmitting ||
    (stats.unmarked === 0 && isEditing && changeSummary.length === 0);

  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-gray-200 bg-white/95 px-6 pt-4 shadow-lg"
      style={{ paddingBottom: Math.max(insetsBottom, 16) }}
    >
      {isEditing ? (
        <Pressable
          onPress={onCancelEditing}
          className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-gray-400 bg-white px-3 active:bg-gray-100"
          accessibilityRole="button"
          accessibilityLabel="Cancel attendance changes"
        >
          <Text className="text-center font-bold text-gray-700">Cancel</Text>
        </Pressable>
      ) : !isReadOnly ? (
        <Pressable
          onPress={onSaveDraft}
          disabled={isSubmitting}
          className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-teal-600 bg-white px-3 active:bg-teal-50"
          accessibilityRole="button"
          accessibilityLabel="Save attendance draft"
        >
          <Text className="text-center font-bold text-teal-700">Save Draft</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={handlePrimaryPress}
        disabled={isPrimaryDisabled}
        accessibilityRole="button"
        accessibilityLabel={
          stats.unmarked > 0
            ? `Review ${stats.unmarked} unmarked ${
                stats.unmarked === 1 ? "child" : "children"
              }`
            : isEditing
              ? "Save attendance changes"
              : "Finalize attendance"
        }
        accessibilityHint={
          stats.unmarked > 0
            ? "Shows the children who still need an attendance status"
            : undefined
        }
        accessibilityState={{
          disabled: isPrimaryDisabled,
          busy: isSubmitting,
        }}
        className={`min-h-14 flex-[1.65] items-center justify-center rounded-2xl px-3 active:opacity-90 ${
          stats.unmarked > 0
            ? "bg-amber-500"
            : isEditing && changeSummary.length === 0
              ? "bg-gray-300"
              : "bg-emerald-600"
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-center text-base font-bold text-white">
            {stats.unmarked > 0
              ? `Review ${stats.unmarked} Unmarked`
              : isEditing
                ? changeSummary.length
                  ? "Save Changes"
                  : "No Changes"
                : "Finalize Attendance"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}


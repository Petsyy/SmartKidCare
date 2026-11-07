import { Pressable, Text, View } from "react-native";

interface AttendanceFinalizedBannerProps {
  isEditing: boolean;
  canEditFinalized: boolean;
  onStartEditing: () => void;
}

export function AttendanceFinalizedBanner({
  isEditing,
  canEditFinalized,
  onStartEditing,
}: AttendanceFinalizedBannerProps) {
  return (
    <View className="mx-6 mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <Text className="text-base font-bold text-emerald-900">
        {isEditing ? "Editing finalized attendance" : "Attendance finalized"}
      </Text>
      <Text className="mt-1 text-sm text-emerald-800">
        {isEditing
          ? "Review every change before saving."
          : canEditFinalized
            ? "You can correct this record until the end of today."
            : "This record is read-only."}
      </Text>
      {!isEditing && canEditFinalized ? (
        <Pressable
          onPress={onStartEditing}
          accessibilityRole="button"
          accessibilityLabel="Edit finalized attendance"
          className="mt-3 min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 active:bg-emerald-800"
        >
          <Text className="font-bold text-white">Edit Attendance</Text>
        </Pressable>
      ) : null}
    </View>
  );
}


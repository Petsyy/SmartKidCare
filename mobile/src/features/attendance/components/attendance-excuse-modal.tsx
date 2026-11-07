import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import type { ExcuseEditorState, ExcuseReason } from "@/src/features/attendance/types";

const REASONS: { value: ExcuseReason; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "medical_appointment", label: "Medical appointment" },
  { value: "family_emergency", label: "Family emergency" },
  { value: "other", label: "Other" },
];

interface AttendanceExcuseModalProps {
  visible: boolean;
  excuseEditor: ExcuseEditorState | null;
  onSelectReason: (reason: ExcuseReason) => void;
  onChangeNotes: (notes: string) => void;
  onCancel: () => void;
  onConfirm: () => boolean;
}

export function AttendanceExcuseModal({
  visible,
  excuseEditor,
  onSelectReason,
  onChangeNotes,
  onCancel,
  onConfirm,
}: AttendanceExcuseModalProps) {
  const handleApply = () => {
    if (!onConfirm()) {
      Alert.alert(
        "Reason required",
        excuseEditor?.reason === "other"
          ? "Enter a short reason."
          : "Choose an excused reason.",
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
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
                onPress={() => onSelectReason(reason.value)}
                className={`min-h-12 justify-center rounded-xl border px-4 ${
                  excuseEditor?.reason === reason.value
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-300"
                }`}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: excuseEditor?.reason === reason.value,
                }}
              >
                <Text className="font-semibold text-gray-800">
                  {reason.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {excuseEditor?.reason === "other" ? (
            <TextInput
              value={excuseEditor.notes}
              onChangeText={onChangeNotes}
              placeholder="Enter a short reason"
              maxLength={250}
              multiline
              className="mt-3 min-h-20 rounded-xl border border-gray-300 px-3 py-2 text-base text-gray-900"
              accessibilityLabel="Other excused reason"
            />
          ) : null}
          <View className="mt-5 flex-row gap-2">
            <Pressable
              onPress={onCancel}
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-gray-300 active:bg-gray-100"
              accessibilityRole="button"
            >
              <Text className="font-bold text-gray-700">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              className="min-h-12 flex-1 items-center justify-center rounded-xl bg-amber-500 active:bg-amber-600"
              accessibilityRole="button"
            >
              <Text className="font-bold text-white">Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


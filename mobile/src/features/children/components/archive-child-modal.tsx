import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const REASONS = [
  "Completed program",
  "Transferred",
  "Withdrawn",
  "Duplicate enrollment",
  "Other",
] as const;

interface ArchiveChildModalProps {
  visible: boolean;
  childName: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (input: { reason: string; note?: string }) => void;
}

export function ArchiveChildModal({
  visible,
  childName,
  loading = false,
  onClose,
  onConfirm,
}: ArchiveChildModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const close = () => {
    if (loading) return;
    setReason(null);
    setNote("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[88%] rounded-t-3xl bg-white px-5 pb-8 pt-5">
          <Text className="text-2xl font-bold text-gray-900">
            Archive child
          </Text>
          <Text className="mt-2 text-base leading-6 text-gray-600">
            {childName} will be removed from daily attendance, feeding,
            competency, nutrition, and pickup actions. Historical records remain
            available.
          </Text>
          <Text className="mb-2 mt-5 text-sm font-bold text-gray-700">
            Reason *
          </Text>
          <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
            {REASONS.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === item }}
                onPress={() => setReason(item)}
                className={`mb-2 min-h-12 justify-center rounded-xl border px-4 ${reason === item ? "border-teal-600 bg-teal-50" : "border-gray-200 bg-white"}`}
              >
                <Text
                  className={`font-medium ${reason === item ? "text-teal-800" : "text-gray-700"}`}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text className="mb-2 mt-4 text-sm font-bold text-gray-700">
            Optional note
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={300}
            multiline
            placeholder="Add context for this archive decision"
            accessibilityLabel="Archive note"
            className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            textAlignVertical="top"
          />
          <Text className="mt-1 text-right text-xs text-gray-500">
            {note.length}/300
          </Text>
          <View className="mt-5 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={close}
              disabled={loading}
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-gray-300"
            >
              <Text className="font-bold text-gray-700">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm archive child"
              accessibilityState={{
                disabled: !reason || loading,
                busy: loading,
              }}
              disabled={!reason || loading}
              onPress={() =>
                reason && onConfirm({ reason, note: note.trim() || undefined })
              }
              className={`min-h-12 flex-1 items-center justify-center rounded-xl ${!reason || loading ? "bg-gray-300" : "bg-rose-600"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-bold text-white">Archive</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

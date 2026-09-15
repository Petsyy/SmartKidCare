import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface SuccessFeedbackModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onDismiss: () => void;
  accessibilityLabel?: string;
}

export function SuccessFeedbackModal({
  visible,
  title,
  message,
  buttonText = "Done",
  onDismiss,
  accessibilityLabel = "Submission confirmation",
}: SuccessFeedbackModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onDismiss}
    >
      <View
        className="flex-1 bg-emerald-50 px-6"
        accessibilityViewIsModal
        accessibilityLabel={accessibilityLabel}
      >
        <View className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100" />
        <View className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-100" />

        <View className="flex-1 items-center justify-center">
          <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-200 bg-white shadow-lg shadow-emerald-200">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-600">
              <CheckCircle2 size={48} color="#FFFFFF" />
            </View>
          </View>

          <Text
            className="mt-8 text-center text-3xl font-extrabold text-emerald-950"
            accessibilityRole="header"
          >
            {title}
          </Text>
          <Text
            className="mt-3 max-w-sm text-center text-lg leading-7 text-emerald-900"
            accessibilityLiveRegion="polite"
          >
            {message}
          </Text>
        </View>

        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={buttonText}
          accessibilityHint="Returns to the previous screen"
          className="min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 shadow-md active:opacity-90"
          style={{ marginBottom: Math.max(insets.bottom + 32, 32) }}
        >
          <Text className="text-xl font-bold text-white">{buttonText}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

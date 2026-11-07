import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

interface FeedingBottomBarProps {
  isReadOnly: boolean;
  isSubmitting: boolean;
  isOffline: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function FeedingBottomBar({
  isReadOnly,
  isSubmitting,
  isOffline,
  onSaveDraft,
  onSubmit,
}: FeedingBottomBarProps) {
  if (isReadOnly) {
    return null;
  }

  const handleSubmitWithAlert = () => {
    Alert.alert(
      "Submit Feeding",
      "Are you sure you want to submit the feeding record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isOffline ? "Submit Offline" : "Submit",
          onPress: onSubmit,
        },
      ],
    );
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-gray-200 bg-white/95 px-6 py-4">
      <Pressable
        onPress={onSaveDraft}
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
        onPress={handleSubmitWithAlert}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={
          isSubmitting
            ? "Submitting feeding record"
            : "Submit feeding record"
        }
        accessibilityHint="Submits today's feeding record to the focal person"
        accessibilityState={{
          disabled: isSubmitting,
          busy: isSubmitting,
        }}
        className={`min-h-14 flex-[1.65] items-center justify-center rounded-2xl px-3 shadow-sm ${
          isSubmitting
            ? "bg-emerald-400"
            : "bg-emerald-600 active:opacity-90"
        }`}
      >
        <View className="flex-row items-center justify-center">
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
  );
}


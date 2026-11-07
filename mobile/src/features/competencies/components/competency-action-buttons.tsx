import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface CompetencyActionButtonsProps {
  isReadOnly: boolean;
  isSubmitting: boolean;
  isComplete: boolean;
  isOffline: boolean;
  isQueueMode: boolean;
  hasNextChild: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function CompetencyActionButtons({
  isReadOnly,
  isSubmitting,
  isComplete,
  isOffline,
  isQueueMode,
  hasNextChild,
  onSaveDraft,
  onSubmit,
}: CompetencyActionButtonsProps) {
  if (isReadOnly) {
    return null;
  }

  const isSubmitDisabled = isSubmitting || !isComplete || isOffline;

  const getSubmitLabel = () => {
    if (isOffline) return "Connect to Submit";
    if (isQueueMode) {
      return hasNextChild ? "Submit & Next Child" : "Submit & Finish";
    }
    return "Submit Evaluation";
  };

  return (
    <View className="gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save competency draft"
        disabled={isSubmitting}
        onPress={onSaveDraft}
        className={`min-h-14 items-center justify-center rounded-2xl border-2 active:opacity-90 ${
          isSubmitting
            ? "border-gray-300 bg-gray-100"
            : "border-teal-600 bg-white"
        }`}
      >
        <Text
          className={`text-lg font-bold ${
            isSubmitting ? "text-gray-400" : "text-teal-700"
          }`}
        >
          Save Draft
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={getSubmitLabel()}
        disabled={isSubmitDisabled}
        onPress={onSubmit}
        className={`min-h-14 items-center justify-center rounded-2xl active:opacity-90 ${
          isSubmitDisabled ? "bg-gray-300" : "bg-teal-600"
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-lg font-bold text-white">
            {getSubmitLabel()}
          </Text>
        )}
      </Pressable>
    </View>
  );
}


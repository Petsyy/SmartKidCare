import { Pressable, Text, View } from "react-native";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";
import type { Step } from "@/src/features/enrollment/types";

interface EnrollmentStepFooterProps {
  step: Step;
  isSubmitting: boolean;
  onCancelOrBack: () => void;
  onNextOrSubmit: () => void;
}

export function EnrollmentStepFooter({
  step,
  isSubmitting,
  onCancelOrBack,
  onNextOrSubmit,
}: EnrollmentStepFooterProps) {
  const primaryLabel =
    step < 5 ? "Next" : isSubmitting ? "Enrolling..." : "Enroll Child";

  return (
    <View className="mt-5 flex-row gap-3">
      <Pressable
        onPress={onCancelOrBack}
        className="active:scale-95"
        accessibilityRole="button"
        accessibilityLabel={step === 1 ? "Cancel enrollment" : "Previous step"}
        style={[
          enrollFieldStyles.footerBtn,
          enrollFieldStyles.footerBtnSecondary,
        ]}
      >
        <Text className="text-center text-lg font-semibold text-gray-900">
          {step === 1 ? "Cancel" : "Back"}
        </Text>
      </Pressable>

      <Pressable
        onPress={onNextOrSubmit}
        disabled={isSubmitting}
        className="active:scale-95"
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        style={[
          enrollFieldStyles.footerBtn,
          isSubmitting
            ? enrollFieldStyles.footerBtnPrimaryDisabled
            : enrollFieldStyles.footerBtnPrimaryIdle,
          !isSubmitting && {
            shadowColor: "#0D9488",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      >
        <Text className="text-center text-lg font-bold text-white">
          {primaryLabel}
        </Text>
      </Pressable>
    </View>
  );
}


import { Pressable, Text, View } from "react-native";
import { ScreenHeader, ScreenShell } from "@/src/components/ui";

interface EditChildOfflineStateProps {
  onBack: () => void;
}

export function EditChildOfflineState({ onBack }: EditChildOfflineStateProps) {
  return (
    <ScreenShell withKeyboardAvoiding={false} edges={[]}>
      <ScreenHeader
        title="Edit Child"
        subtitle="Internet connection required"
        backgroundVariant="teacherGradient"
        onBack={onBack}
      />
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <View className="w-full rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <Text className="text-center text-xl font-bold text-amber-900">
            Child information is read-only offline
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-amber-800">
            Connect to the internet to update this child’s personal or parent
            information.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to child details"
            onPress={onBack}
            className="mt-5 min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-4 active:bg-teal-700"
          >
            <Text className="font-semibold text-white">
              Back to Child Details
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenShell>
  );
}


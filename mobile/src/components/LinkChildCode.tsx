import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Baby } from "lucide-react-native";
import { useRouter } from "expo-router";

type Props = {
  onLinked: () => void;
};

// Placeholder component kept for compatibility; link codes are no longer used.
export default function LinkChildCode({ onLinked }: Props) {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#ecfdf5", "#d1fae5", "#a7f3d0"]}
      className="flex-1"
    >
      <View className="flex-1 px-6 py-10 items-center justify-center">
        <Pressable
          onPress={() => router.replace("/login")}
          className="absolute left-4 top-10 p-2"
        >
          <ChevronLeft size={28} color="#0d9488" />
        </Pressable>
        <View className="w-20 h-20 items-center justify-center rounded-full bg-teal-500/20 mb-4 border-2 border-teal-400/50">
          <Baby size={40} color="#0d9488" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
          Link codes are disabled
        </Text>
        <Text className="text-base text-gray-600 text-center mb-6">
          Your account is active; you don’t need a child link code to proceed.
        </Text>
        <Pressable
          className="bg-teal-600 px-6 py-3 rounded-lg"
          onPress={onLinked}
        >
          <Text className="text-white font-semibold text-base">
            Continue
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

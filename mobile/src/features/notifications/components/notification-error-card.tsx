import { AlertCircle } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface NotificationErrorCardProps {
  error: string;
  onRetry: () => void;
}

export function NotificationErrorCard({
  error,
  onRetry,
}: NotificationErrorCardProps) {
  return (
    <View className="mt-4 flex-row items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
        <AlertCircle size={20} color="#BE123C" strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-rose-800">
          Something went wrong
        </Text>
        <Text className="mt-1 text-sm leading-5 text-rose-700">
          {error}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try loading notifications again"
          onPress={onRetry}
          className="mt-3 self-start rounded-full bg-rose-600 px-4 py-2 active:bg-rose-700"
        >
          <Text className="text-xs font-bold text-white">Try again</Text>
        </Pressable>
      </View>
    </View>
  );
}


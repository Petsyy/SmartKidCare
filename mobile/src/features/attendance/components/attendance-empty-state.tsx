import { Users } from "lucide-react-native";
import { Text, View } from "react-native";

export function AttendanceEmptyState() {
  return (
    <View className="mx-6 items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10">
      <Users size={44} color="#D1D5DB" />
      <Text className="mt-3 text-center text-base font-semibold text-gray-600">
        No children match this filter
      </Text>
      <Text className="mt-1 text-center text-sm text-gray-400">
        Try another status or search term.
      </Text>
    </View>
  );
}


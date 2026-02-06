import { Text, View, TouchableOpacity } from "react-native";
import { User, ChevronRight } from "lucide-react-native";

type Props = {
  name: string;
  age: number;
  gender: string;

  // NEW (today overview)
  attendance?: "Present" | "Absent" | "Late";
  feeding?: "Finished" | "Partial" | "Not eaten";
  lastUpdated?: string;

  onPress?: () => void;
};

export default function ChildCard({
  name,
  age,
  gender,
  attendance = "Present",
  feeding = "Finished",
  lastUpdated = "Today 10:30 AM",
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      className="
        w-full bg-white rounded-3xl
        px-5 py-4
        border border-gray-100
        shadow-md
      "
    >
      {/* Top Row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mr-4">
            <User size={26} color="#10B981" />
          </View>

          {/* Name & basic info */}
          <View className="flex-1">
            <Text
              className="text-2xl font-semibold text-gray-900"
              numberOfLines={1}
            >
              {name}
            </Text>

            <Text className="text-xl text-gray-500 mt-1">
              {age} years old • {gender}
            </Text>
          </View>
        </View>

        <ChevronRight size={28} color="#9CA3AF" />
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-100 my-4" />

      {/* Today Section */}
      <View>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Today:
        </Text>

        <View className="flex-row items-center">
          <Text className="text-lg text-gray-600">
            Attendance:{" "}
            <Text className="font-semibold text-gray-800">
              {attendance}
            </Text>
          </Text>

          <Text className="text-gray-400 mx-3">•</Text>

          <Text className="text-lg text-gray-600">
            Feeding:{" "}
            <Text className="font-semibold text-gray-800">
              {feeding}
            </Text>
          </Text>
        </View>
      </View>

      {/* Last Updated */}
      <Text className="text-base text-gray-400 mt-3">
        Last updated: {lastUpdated}
      </Text>
    </TouchableOpacity>
  );
}

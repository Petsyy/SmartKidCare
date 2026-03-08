import { Text, View, TouchableOpacity } from "react-native";
import { User, ChevronRight, CheckCircle2, XCircle } from "lucide-react-native";

type Props = {
  name: string;
  age: number;
  gender: string;
  attendance?: "Present" | "Absent" | "Not Recorded";
  feeding?: "Finished" | "Missed" | "Not Recorded";
  lastUpdated?: string;
  onPress?: () => void;
};

export default function ChildCard({
  name,
  age,
  gender,
  attendance = "Not Recorded",
  feeding = "Not Recorded",
  lastUpdated = "No data",
  onPress,
}: Props) {
  const isDone = attendance === "Present" && feeding === "Finished";

  const statusBar =
    isDone ? "bg-emerald-500" :
    attendance === "Present" ? "bg-yellow-400" :
    "bg-gray-300";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="relative w-full bg-white rounded-3xl px-5 py-4 border border-gray-100 shadow-md"
    >
      {/* Status Bar */}
      <View className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl ${statusBar}`} />

      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mr-4">
            <User size={22} color="#10B981" />
          </View>

          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-base text-gray-500 mt-0.5">
              {age} years old • {gender}
            </Text>
          </View>
        </View>

        <ChevronRight size={22} color="#9CA3AF" />
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-100 my-3" />

      {/* Status Chips */}
      <View className="flex-row items-center gap-2">
        <View className={`px-3 py-1 rounded-full ${
          attendance === "Present" ? "bg-emerald-100" : "bg-gray-100"
        }`}>
          <Text className={`text-base font-semibold ${
            attendance === "Present" ? "text-emerald-700" : "text-gray-600"
          }`}>
            Attendance: {attendance}
          </Text>
        </View>

        <View className={`px-3 py-1 rounded-full ${
          feeding === "Finished" ? "bg-emerald-100" : "bg-gray-100"
        }`}>
          <Text className={`text-base font-semibold ${
            feeding === "Finished" ? "text-emerald-700" : "text-gray-600"
          }`}>
            Feeding: {feeding}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-sm text-gray-400">
          Last updated: {lastUpdated}
        </Text>

        {isDone ? (
          <CheckCircle2 size={18} color="#10B981" />
        ) : (
          <XCircle size={18} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );
}

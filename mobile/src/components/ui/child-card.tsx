import { Text, View, Pressable } from "react-native";
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

  const accentColor = isDone
    ? "#10B981"
    : attendance === "Present"
      ? "#FBBF24"
      : "#D1D5DB";

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-3xl bg-white active:scale-[0.98]"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Accent bar */}
        <View style={{ width: 4, backgroundColor: accentColor }} />

        <View className="flex-1 p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-2xl bg-emerald-50 items-center justify-center mr-4">
                <User size={28} color="#10B981" />
              </View>

              <View className="flex-1">
                <Text className="text-xl font-black text-gray-900" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-base font-bold text-gray-500 mt-0.5">
                  {age} years old • {gender}
                </Text>
              </View>
            </View>

            <ChevronRight size={24} color="#94A3B8" />
          </View>

          {/* Status Chips */}
          <View className="flex-row items-center gap-2 mt-3">
            <View
              className={`px-3 py-1.5 rounded-full ${
                attendance === "Present" ? "bg-emerald-50" : attendance === "Absent" ? "bg-red-50" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-black ${
                  attendance === "Present" ? "text-emerald-700" : attendance === "Absent" ? "text-red-600" : "text-gray-500"
                }`}
              >
                {attendance}
              </Text>
            </View>

            <View
              className={`px-3 py-1.5 rounded-full ${
                feeding === "Finished" ? "bg-emerald-50" : feeding === "Missed" ? "bg-red-50" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-black ${
                  feeding === "Finished" ? "text-emerald-700" : feeding === "Missed" ? "text-red-600" : "text-gray-500"
                }`}
              >
                Feeding: {feeding}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <Text className="text-sm font-bold text-gray-400">
              Last updated: {lastUpdated}
            </Text>

            {isDone ? (
              <CheckCircle2 size={20} color="#10B981" />
            ) : (
              <XCircle size={20} color="#D1D5DB" />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

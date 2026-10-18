import React from "react";
import { View, Text } from "react-native";
import { Activity } from "lucide-react-native";

interface TodayStatusCardProps {
  status: {
    attendance: string;
    feeding: string;
  };
  feedingRecord?: {
    foodServed?: string;
  } | null;
}

export function TodayStatusCard({ status, feedingRecord }: TodayStatusCardProps) {
  return (
    <View
      className="rounded-3xl bg-white p-5 mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center mb-4 gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
          <Activity size={20} color="#059669" />
        </View>
        <Text className="text-xl font-bold text-gray-900">
          Today&apos;s Status
        </Text>
      </View>

      <View className="flex-row gap-3 mb-3">
        <View
          className={`flex-1 rounded-2xl px-4 py-3 ${
            status.attendance === "Present"
              ? "bg-emerald-50 border border-emerald-100"
              : status.attendance === "Absent"
                ? "bg-red-50 border border-red-100"
                : status.attendance === "Excused"
                  ? "bg-amber-50 border border-amber-100"
                  : "bg-gray-50 border border-gray-200"
          }`}
        >
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Attendance
          </Text>
          <Text
            className={`text-lg font-bold mt-0.5 ${
              status.attendance === "Present"
                ? "text-emerald-700"
                : status.attendance === "Absent"
                  ? "text-red-700"
                  : status.attendance === "Excused"
                    ? "text-amber-700"
                    : "text-gray-600"
            }`}
          >
            {status.attendance}
          </Text>
        </View>

        <View
          className={`flex-1 rounded-2xl px-4 py-3 ${
            status.feeding === "Completed"
              ? "bg-emerald-50 border border-emerald-100"
              : status.feeding === "Missed"
                ? "bg-red-50 border border-red-100"
                : "bg-gray-50 border border-gray-200"
          }`}
        >
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Feeding
          </Text>
          <Text
            className={`text-lg font-bold mt-0.5 ${
              status.feeding === "Completed"
                ? "text-emerald-700"
                : status.feeding === "Missed"
                  ? "text-red-700"
                  : "text-gray-600"
            }`}
          >
            {status.feeding}
          </Text>
        </View>
      </View>

      {feedingRecord && (
        <View className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Today&apos;s Menu
          </Text>
          <Text className="text-base font-semibold text-gray-800">
            {feedingRecord.foodServed || "Not specified"}
          </Text>
        </View>
      )}
    </View>
  );
}

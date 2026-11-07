import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight, ClipboardCheck, Utensils } from "lucide-react-native";

export interface ParentChildOverviewCardProps {
  childFullName: string;
  childDetails: string;
  attendanceStatus: string | null;
  attendanceTime: string | null;
  mealStatus: string | null;
  mealTime: string | null;
  onPress: () => void;
}

export function ParentChildOverviewCard({
  childFullName,
  childDetails,
  attendanceStatus,
  attendanceTime,
  mealStatus,
  mealTime,
  onPress,
}: ParentChildOverviewCardProps) {
  const attendanceStatusText =
    attendanceStatus === "present"
      ? "Present"
      : attendanceStatus === "absent"
        ? "Absent"
        : "Not recorded";

  const mealStatusText =
    mealStatus === "completed"
      ? "Finished"
      : mealStatus === "missed"
        ? "Not finished"
        : "Not recorded";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${childFullName}. ${childDetails}. Attendance: ${attendanceStatusText}. Feeding: ${mealStatusText}. View child's profile and records.`}
      accessibilityHint="Opens your child's full profile and records"
      className="mb-5 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm active:bg-gray-50/80"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2.5 pr-2">
          <Text
            className="text-2xl font-black leading-8 text-gray-900"
            numberOfLines={1}
          >
            {childFullName}
          </Text>
          <View className="flex-row items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
            <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="text-xs font-bold text-emerald-800">
              Enrolled
            </Text>
          </View>
        </View>

        <Text className="text-sm font-bold text-gray-500">
          {childDetails}
        </Text>
      </View>

      <View className="mt-4 rounded-2xl border border-teal-100/60 bg-teal-50/50 p-4">
        {/* Row 1: Attendance */}
        <View className="flex-row items-center justify-between py-0.5">
          <View className="flex-1 flex-row items-center gap-3 pr-3">
            <View
              className={`h-11 w-11 items-center justify-center rounded-xl ${
                attendanceStatus === "present"
                  ? "bg-emerald-100"
                  : attendanceStatus === "absent"
                    ? "bg-rose-100"
                    : "bg-gray-100"
              }`}
            >
              <ClipboardCheck
                size={24}
                color={
                  attendanceStatus === "present"
                    ? "#047857"
                    : attendanceStatus === "absent"
                      ? "#DC2626"
                      : "#6B7280"
                }
              />
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                Attendance
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 text-xs font-medium text-gray-500"
              >
                {attendanceStatus === "present"
                  ? attendanceTime
                    ? `Checked in at ${attendanceTime}`
                    : "Checked in for class"
                  : attendanceStatus === "absent"
                    ? "Reported absent today"
                    : "Awaiting teacher update"}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-full border px-3.5 py-1 ${
              attendanceStatus === "present"
                ? "border-emerald-200 bg-emerald-50"
                : attendanceStatus === "absent"
                  ? "border-rose-200 bg-rose-50"
                  : "border-gray-200 bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                attendanceStatus === "present"
                  ? "text-emerald-700"
                  : attendanceStatus === "absent"
                    ? "text-rose-700"
                    : "text-gray-600"
              }`}
            >
              {attendanceStatus === "present"
                ? "Present"
                : attendanceStatus === "absent"
                  ? "Absent"
                  : "Not Recorded"}
            </Text>
          </View>
        </View>

        <View className="my-3 h-px bg-teal-100/70" />

        <View className="flex-row items-center justify-between py-0.5">
          <View className="flex-1 flex-row items-center gap-3 pr-3">
            <View
              className={`h-11 w-11 items-center justify-center rounded-xl ${
                mealStatus === "completed"
                  ? "bg-emerald-100"
                  : mealStatus === "missed"
                    ? "bg-amber-100"
                    : "bg-gray-100"
              }`}
            >
              <Utensils
                size={24}
                color={
                  mealStatus === "completed"
                    ? "#047857"
                    : mealStatus === "missed"
                      ? "#D97706"
                      : "#6B7280"
                }
              />
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                Feeding
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 text-xs font-medium text-gray-500"
              >
                {mealStatus === "completed"
                  ? mealTime
                    ? `Served at ${mealTime}`
                    : "Completed meal session"
                  : mealStatus === "missed"
                    ? "Missed scheduled meal"
                    : "Awaiting teacher update"}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-full border px-3.5 py-1 ${
              mealStatus === "completed"
                ? "border-emerald-200 bg-emerald-50"
                : mealStatus === "missed"
                  ? "border-amber-200 bg-amber-50"
                  : "border-gray-200 bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                mealStatus === "completed"
                  ? "text-emerald-700"
                  : mealStatus === "missed"
                    ? "text-amber-700"
                    : "text-gray-600"
              }`}
            >
              {mealStatus === "completed"
                ? "Finished"
                : mealStatus === "missed"
                  ? "Not Finished"
                  : "Not Recorded"}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3.5 flex-row items-center justify-between border-t border-gray-100 pt-3">
        <Text className="text-sm font-extrabold text-teal-700">
          View child&apos;s profile & records
        </Text>
        <ChevronRight size={19} color="#0D9488" />
      </View>
    </Pressable>
  );
}


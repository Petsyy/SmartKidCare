import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Utensils,
} from "lucide-react-native";

export interface ParentRecordsSectionProps {
  childFirstName: string;
  attendanceStatus: string | null;
  presentCount: number;
  absentCount: number;
  mealStatus: string | null;
  mealsCompleted: number;
  mealsMissed: number;
  onOpenAttendance: () => void;
  onOpenMeals: () => void;
}

export function ParentRecordsSection({
  childFirstName,
  attendanceStatus,
  presentCount,
  absentCount,
  mealStatus,
  mealsCompleted,
  mealsMissed,
  onOpenAttendance,
  onOpenMeals,
}: ParentRecordsSectionProps) {
  return (
    <>
      <View className="mb-2.5 flex-row items-end justify-between">
        <View>
          <Text
            className="text-2xl font-black text-gray-900"
            accessibilityRole="header"
          >
            Records and history
          </Text>
          <Text className="mt-0.5 text-base text-gray-600">
            Review past attendance and meal updates
          </Text>
        </View>
      </View>

      <View className="mb-6 gap-3">
        <Pressable
          onPress={onOpenAttendance}
          accessibilityRole="button"
          accessibilityLabel={`See ${childFirstName}'s attendance records. Today: ${
            attendanceStatus ? "recorded" : "no update yet"
          }. History: ${presentCount} present and ${absentCount} absent.`}
          accessibilityHint="Opens attendance history"
          className="min-h-28 flex-row items-center rounded-3xl border border-teal-200 bg-teal-50 p-4 shadow-sm active:opacity-85"
        >
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-600">
            <ClipboardCheck size={27} color="#FFFFFF" />
          </View>
          <View className="ml-4 flex-1 py-0.5">
            <Text className="text-xl font-extrabold text-gray-900">
              Attendance
            </Text>
            <View className="mt-1.5 flex-row items-center">
              {attendanceStatus === "present" ? (
                <CheckCircle2 size={17} color="#047857" />
              ) : attendanceStatus === "absent" ||
                attendanceStatus === "excused" ? (
                <AlertCircle size={17} color="#BE123C" />
              ) : (
                <Clock3 size={17} color="#0F766E" />
              )}
              <Text
                className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                  attendanceStatus === "present"
                    ? "text-emerald-700"
                    : attendanceStatus === "absent"
                      ? "text-rose-600"
                      : attendanceStatus === "excused"
                        ? "text-amber-700"
                        : "text-teal-700"
                }`}
              >
                Today: {attendanceStatus ? "Recorded" : "No update yet"}
              </Text>
            </View>
            <Text className="mt-2 text-base font-semibold leading-5 text-gray-700">
              {presentCount} present · {absentCount} absent
            </Text>
          </View>
          <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-teal-600 shadow-sm">
            <ArrowUpRight size={21} color="#FFFFFF" />
          </View>
        </Pressable>

        <Pressable
          onPress={onOpenMeals}
          accessibilityRole="button"
          accessibilityLabel={`See ${childFirstName}'s meal records. Today: ${
            mealStatus ? "recorded" : "no meal update yet"
          }. History: ${mealsCompleted} finished${
            mealsMissed > 0 ? ` and ${mealsMissed} missed` : ""
          }.`}
          accessibilityHint="Opens meal history"
          className="min-h-28 flex-row items-center rounded-3xl border border-orange-200 bg-orange-50 p-4 shadow-sm active:opacity-85"
        >
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <Utensils size={27} color="#FFFFFF" />
          </View>
          <View className="ml-4 flex-1 py-0.5">
            <Text className="text-xl font-extrabold text-gray-900">
              Meals
            </Text>
            <View className="mt-1.5 flex-row items-center">
              {mealStatus === "completed" ? (
                <CheckCircle2 size={17} color="#047857" />
              ) : mealStatus === "missed" ? (
                <AlertCircle size={17} color="#C2410C" />
              ) : (
                <Clock3 size={17} color="#C2410C" />
              )}
              <Text
                className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                  mealStatus === "completed"
                    ? "text-emerald-700"
                    : "text-orange-700"
                }`}
              >
                Today: {mealStatus ? "Recorded" : "No meal update yet"}
              </Text>
            </View>
            <Text className="mt-2 text-base font-semibold leading-5 text-gray-700">
              {mealsCompleted} finished
              {mealsMissed > 0 ? ` · ${mealsMissed} missed` : ""}
            </Text>
          </View>
          <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-orange-500 shadow-sm">
            <ArrowUpRight size={21} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </>
  );
}


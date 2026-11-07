import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Utensils,
} from "lucide-react-native";

export interface TeacherDailyTasksSectionProps {
  hasChildren: boolean;
  attendanceSubmitted: boolean;
  feedingSubmitted: boolean;
  feedingNotRequired: boolean;
  feedingActionEnabled: boolean;
  allDailyTasksDone: boolean;
  onOpenAttendance: () => void;
  onOpenFeeding: () => void;
}

export function TeacherDailyTasksSection({
  hasChildren,
  attendanceSubmitted,
  feedingSubmitted,
  feedingNotRequired,
  feedingActionEnabled,
  allDailyTasksDone,
  onOpenAttendance,
  onOpenFeeding,
}: TeacherDailyTasksSectionProps) {
  return (
    <>
      <View className="mb-2.5 flex-row items-end justify-between">
        <View>
          <Text
            className="text-2xl font-black text-gray-900"
            accessibilityRole="header"
          >
            Start here
          </Text>
          <Text
            className={`mt-0.5 text-base ${
              allDailyTasksDone
                ? "font-semibold text-emerald-700"
                : "text-gray-600"
            }`}
          >
            {allDailyTasksDone
              ? "All daily tasks completed for today ✓"
              : "Your primary tasks for today"}
          </Text>
        </View>
      </View>

      <View className="mb-5 gap-3">
        <Pressable
          onPress={onOpenAttendance}
          disabled={!hasChildren}
          accessibilityRole="button"
          accessibilityLabel={
            attendanceSubmitted
              ? "View submitted attendance"
              : !hasChildren
                ? "Attendance unavailable because no children are assigned"
                : "Record today's attendance"
          }
          accessibilityState={{ disabled: !hasChildren }}
          className={`min-h-32 flex-row items-center rounded-3xl border p-4 shadow-sm active:opacity-85 ${
            hasChildren
              ? "border-sky-200 bg-sky-50"
              : "border-gray-200 bg-gray-100 opacity-70"
          }`}
        >
          <View
            className={`h-14 w-14 items-center justify-center rounded-2xl ${
              hasChildren ? "bg-sky-600" : "bg-gray-400"
            }`}
          >
            <ClipboardCheck size={27} color="#FFFFFF" />
          </View>
          <View className="ml-4 flex-1 py-0.5">
            <Text className="text-xl font-extrabold text-gray-900">
              Attendance
            </Text>
            <View className="mt-1.5 flex-row items-center">
              {attendanceSubmitted ? (
                <CheckCircle2 size={17} color="#047857" />
              ) : (
                <Clock3 size={17} color="#0369A1" />
              )}
              <Text
                className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                  attendanceSubmitted
                    ? "text-emerald-700"
                    : hasChildren
                      ? "text-sky-700"
                      : "text-gray-500"
                }`}
              >
                {attendanceSubmitted
                  ? "Completed today"
                  : hasChildren
                    ? "Ready to record"
                    : "No children"}
              </Text>
            </View>
            <Text className="mt-1.5 text-sm leading-5 text-gray-600">
              {attendanceSubmitted
                ? "Review today's submitted record."
                : "Check who is present in class."}
            </Text>
          </View>
          {hasChildren ? (
            <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-sky-600 shadow-sm">
              <ArrowUpRight size={21} color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>

        <Pressable
          onPress={onOpenFeeding}
          disabled={!feedingActionEnabled}
          accessibilityRole="button"
          accessibilityLabel={
            feedingSubmitted
              ? "View submitted feeding record"
              : !hasChildren
                ? "Feeding unavailable because no children are assigned"
                : feedingNotRequired
                  ? "Feeding is not needed because no children are present"
                  : "Open feeding records and select a date"
          }
          accessibilityState={{ disabled: !feedingActionEnabled }}
          className={`min-h-32 flex-row items-center rounded-3xl border p-4 shadow-sm active:opacity-85 ${
            feedingActionEnabled || feedingSubmitted || feedingNotRequired
              ? "border-orange-200 bg-orange-50"
              : "border-gray-200 bg-gray-100 opacity-70"
          }`}
        >
          <View
            className={`h-14 w-14 items-center justify-center rounded-2xl ${
              feedingActionEnabled || feedingSubmitted || feedingNotRequired
                ? "bg-orange-500"
                : "bg-gray-400"
            }`}
          >
            <Utensils size={27} color="#FFFFFF" />
          </View>
          <View className="ml-4 flex-1 py-0.5">
            <Text className="text-xl font-extrabold text-gray-900">
              Feeding
            </Text>
            <View className="mt-1.5 flex-row items-center">
              {feedingSubmitted || feedingNotRequired ? (
                <CheckCircle2 size={17} color="#047857" />
              ) : (
                <Clock3 size={17} color="#C2410C" />
              )}
              <Text
                className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                  feedingSubmitted || feedingNotRequired
                    ? "text-emerald-700"
                    : feedingActionEnabled
                      ? "text-orange-700"
                      : "text-gray-500"
                }`}
              >
                {feedingSubmitted
                  ? "Completed today"
                  : feedingNotRequired
                    ? "Skipped today"
                    : "Ready to record"}
              </Text>
            </View>
            <Text className="mt-1.5 text-sm leading-5 text-gray-600">
              {feedingSubmitted
                ? "Review today's submitted record."
                : feedingNotRequired
                  ? "No present children today."
                  : "Select today or a past date to log a meal."}
            </Text>
          </View>
          {feedingActionEnabled || feedingSubmitted || feedingNotRequired ? (
            <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-orange-500 shadow-sm">
              <ArrowUpRight size={21} color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>
      </View>
    </>
  );
}


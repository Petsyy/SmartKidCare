import React from "react";
import { View, Text, Pressable } from "react-native";
import { ArrowUpRight, ClipboardCheck, HeartPulse } from "lucide-react-native";

export interface TeacherAssessmentsSectionProps {
  hasChildren: boolean;
  onOpenNutrition: () => void;
  onOpenCompetencies: () => void;
}

export function TeacherAssessmentsSection({
  hasChildren,
  onOpenNutrition,
  onOpenCompetencies,
}: TeacherAssessmentsSectionProps) {
  return (
    <View className="mb-3">
      <Text
        className="mb-3 text-2xl font-black text-gray-900"
        accessibilityRole="header"
      >
        Assessments
      </Text>

      <Pressable
        onPress={onOpenNutrition}
        disabled={!hasChildren}
        accessibilityRole="button"
        accessibilityLabel={
          !hasChildren
            ? "Nutrition assessment unavailable because no children are assigned"
            : "Record final nutritional assessment"
        }
        accessibilityState={{ disabled: !hasChildren }}
        className={`min-h-32 flex-row items-center rounded-3xl border p-4 shadow-sm active:opacity-85 ${
          hasChildren
            ? "border-teal-200 bg-teal-50"
            : "border-gray-200 bg-gray-100 opacity-70"
        }`}
      >
        <View
          className={`h-14 w-14 items-center justify-center rounded-2xl ${
            hasChildren ? "bg-teal-600" : "bg-gray-400"
          }`}
        >
          <HeartPulse size={27} color="#FFFFFF" />
        </View>
        <View className="ml-4 flex-1 py-0.5">
          <Text className="text-xl font-extrabold text-gray-900">
            Nutrition Assessment
          </Text>
          <View className="mt-1.5 flex-row items-center">
            <HeartPulse size={17} color={hasChildren ? "#0D9488" : "#6B7280"} />
            <Text
              className={`ml-1.5 flex-1 text-sm font-bold leading-5 ${
                hasChildren ? "text-teal-700" : "text-gray-500"
              }`}
            >
              {hasChildren ? "Final assessment" : "No children"}
            </Text>
          </View>
          <Text className="mt-1.5 text-sm leading-5 text-gray-600">
            {hasChildren
              ? "Record end-of-year weight & height."
              : "Assign children to get started."}
          </Text>
        </View>
        {hasChildren ? (
          <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-teal-600 shadow-sm">
            <ArrowUpRight size={21} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>

      <Pressable
        onPress={onOpenCompetencies}
        disabled={!hasChildren}
        accessibilityRole="button"
        accessibilityLabel="Open class competency evaluation queue"
        accessibilityState={{ disabled: !hasChildren }}
        className={`mt-3 min-h-28 flex-row items-center rounded-3xl border p-4 shadow-sm active:opacity-85 ${
          hasChildren
            ? "border-blue-200 bg-blue-50"
            : "border-gray-200 bg-gray-100 opacity-70"
        }`}
      >
        <View
          className={`h-14 w-14 items-center justify-center rounded-2xl ${
            hasChildren ? "bg-blue-600" : "bg-gray-400"
          }`}
        >
          <ClipboardCheck size={27} color="#FFFFFF" />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-xl font-extrabold text-gray-900">
            Competency Evaluation
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-gray-600">
            Evaluate each child using the class queue.
          </Text>
        </View>
        {hasChildren ? (
          <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-blue-600">
            <ArrowUpRight size={21} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}


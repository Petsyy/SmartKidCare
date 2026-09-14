import React, { useState } from "react";
import { View, Text, FlatList, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  EmptyStateCard,
} from "@/src/components/ui";
import {
  useMyClassNutrition,
  useEvaluateNutrition,
} from "../hooks/useNutrition";
import { StudentNutritionCard } from "../components/student-nutrition-card";
import type { NutritionPeriod } from "@/src/api/nutrition.api";

const getCurrentSchoolYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, so June = 5
  return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export const TeacherNutritionScreen = () => {
  const router = useRouter();
  const schoolYear = getCurrentSchoolYear();
  const [period, setPeriod] = useState<NutritionPeriod>("initial");
  const {
    data: students,
    isLoading,
    isError,
    error,
  } = useMyClassNutrition(schoolYear, period);
  const evaluateNutrition = useEvaluateNutrition();

  const [localInputs, setLocalInputs] = useState<
    Record<string, { weight: string; height: string }>
  >({});

  const handleInputChange = (
    childId: string,
    field: "weight" | "height",
    value: string,
  ) => {
    const inputKey = `${period}:${childId}`;
    setLocalInputs((prev) => ({
      ...prev,
      [inputKey]: {
        ...prev[inputKey],
        [field]: value,
      },
    }));
  };

  const handleSave = (childId: string, action: "draft" | "submit") => {
    const inputs = localInputs[`${period}:${childId}`];
    if (!inputs || !inputs.weight || !inputs.height) {
      alert("Please enter both weight and height.");
      return;
    }

    evaluateNutrition.mutate(
      {
        childId,
        schoolYear,
        period,
        measurementDate: new Date().toISOString(),
        weight: parseFloat(inputs.weight),
        height: parseFloat(inputs.height),
        action,
      },
      {
        onSuccess: () => {
          Alert.alert(
            action === "submit" ? "Assessment Submitted" : "Draft Saved",
            action === "submit"
              ? "The nutritional measurement has been submitted."
              : "Your progress has been saved as a draft.",
          );
        },
        onError: (err) => {
          Alert.alert("Error", err.message || "Failed to save assessment.");
        },
      },
    );
  };

  if (isLoading)
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Nutrition Assessment"
          onBack={() => router.back()}
        />
        <ScreenLoadingState
          title="Loading nutrition records"
          message="Getting your class nutrition assessments ready."
        />
      </ScreenShell>
    );

  if (isError)
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Nutrition Assessment"
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-bold text-red-600 mb-2">
            Error loading students
          </Text>
          <Text className="text-center text-gray-600">
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
        </View>
      </ScreenShell>
    );

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Nutrition Assessment"
        subtitle={`Class List (${schoolYear})`}
        onBack={() => router.push("/(teacher)")}
      />

      <View className="flex-1 bg-gray-50">
        <View className="mx-6 mt-4 flex-row rounded-2xl border border-gray-200 bg-white p-1">
          {(["initial", "final"] as NutritionPeriod[]).map((option) => {
            const isSelected = period === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${option} assessment`}
                onPress={() => setPeriod(option)}
                className={`flex-1 items-center rounded-xl px-3 py-3 ${
                  isSelected ? "bg-teal-600" : "bg-white"
                }`}
              >
                <Text
                  className={`font-bold ${
                    isSelected ? "text-white" : "text-gray-600"
                  }`}
                >
                  {option === "initial" ? "Initial" : "Final"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <FlatList
          data={students}
          keyExtractor={(item) => item.child._id}
          contentContainerStyle={[
            { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
            !students?.length && { flex: 1, justifyContent: "center" },
          ]}
          ListEmptyComponent={
            <EmptyStateCard
              icon={Users}
              title="No children assigned"
              description="You do not have any students assigned to your class yet."
            />
          }
          renderItem={({ item }) => (
            <StudentNutritionCard
              child={item.child}
              record={item.record}
              initialRecord={item.initialRecord}
              period={period}
              localInput={localInputs[`${period}:${item.child._id}`]}
              isPending={evaluateNutrition.isPending}
              isSubmitting={
                evaluateNutrition.isPending &&
                evaluateNutrition.variables?.childId === item.child._id
              }
              onSave={handleSave}
              onInputChange={handleInputChange}
            />
          )}
        />
      </View>
    </ScreenShell>
  );
};

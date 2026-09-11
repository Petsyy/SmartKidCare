import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import {
  calculateBmi,
  classifyNutritionalStatus,
} from "@/src/features/enrollment/utils/enrollment-utils";

export interface StudentNutritionCardProps {
  child: {
    _id: string;
    firstName: string;
    lastName: string;
    age: number;
  };
  record?: {
    status: "draft" | "submitted";
    weight: number;
    height: number;
    bmi: number;
    nutritionalStatus: string;
  };
  initialRecord?: {
    weight: number;
    height: number;
  };
  localInput?: { weight: string; height: string };
  isPending?: boolean;
  isSubmitting?: boolean; // To know if THIS specific card is submitting
  onSave: (childId: string, action: "draft" | "submit") => void;
  onInputChange: (
    childId: string,
    field: "weight" | "height",
    value: string,
  ) => void;
}

export const StudentNutritionCard: React.FC<StudentNutritionCardProps> = ({
  child,
  record,
  initialRecord,
  localInput,
  isPending = false,
  isSubmitting = false,
  onSave,
  onInputChange,
}) => {
  const isSubmitted = record?.status === "submitted";

  // Live calculation logic
  const currentWeight =
    localInput?.weight !== undefined
      ? localInput.weight
      : record?.weight?.toString() || "";
  const currentHeight =
    localInput?.height !== undefined
      ? localInput.height
      : record?.height?.toString() || "";

  const numWeight = parseFloat(currentWeight);
  const numHeight = parseFloat(currentHeight);

  let liveBmi = 0;
  let liveStatus: string | null = null;

  if (
    !isNaN(numWeight) &&
    !isNaN(numHeight) &&
    numWeight > 0 &&
    numHeight > 0
  ) {
    liveBmi = calculateBmi(numWeight, numHeight);
    liveStatus = classifyNutritionalStatus(liveBmi, child.age);
  }

  return (
    <View className="mb-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <Text className="text-lg font-extrabold text-gray-900">
        {child.firstName} {child.lastName}
      </Text>

      {initialRecord && (
        <View className="mt-2 flex-row items-center rounded-xl bg-gray-50 p-3 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-500">
            Initial Record:{" "}
            <Text className="text-gray-900">
              {initialRecord.weight}kg | {initialRecord.height}cm
            </Text>
          </Text>
        </View>
      )}

      {isSubmitted ? (
        <View className="mt-4 rounded-2xl bg-teal-50 border border-teal-100 p-4">
          <View className="flex-row items-center mb-2">
            <CheckCircle2 size={18} color="#0D9488" />
            <Text className="ml-2 font-bold text-teal-800">
              Final Assessment Submitted
            </Text>
          </View>
          <View className="bg-white rounded-xl p-3 border border-teal-50">
            <Text className="text-sm font-semibold text-gray-600 mb-1">
              Metrics:{" "}
              <Text className="text-gray-900">
                {record.weight}kg | {record.height}cm
              </Text>
            </Text>
            <Text className="text-sm font-semibold text-gray-600">
              Status:{" "}
              <Text className="text-gray-900">{record.nutritionalStatus}</Text>
              <Text className="text-gray-400">
                {" "}
                (BMI: {record.bmi.toFixed(2)})
              </Text>
            </Text>
          </View>
        </View>
      ) : (
        <View className="mt-4">
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-700 mb-1.5 ml-1">
                Weight (kg)
              </Text>
              <TextInput
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold text-gray-900"
                keyboardType="numeric"
                placeholder="e.g. 15.5"
                value={currentWeight}
                onChangeText={(text) =>
                  onInputChange(child._id, "weight", text)
                }
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-700 mb-1.5 ml-1">
                Height (cm)
              </Text>
              <TextInput
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold text-gray-900"
                keyboardType="numeric"
                placeholder="e.g. 100.5"
                value={currentHeight}
                onChangeText={(text) =>
                  onInputChange(child._id, "height", text)
                }
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-400 mb-1.5 ml-1">
                BMI (Auto)
              </Text>
              <TextInput
                className="h-12 rounded-xl border border-gray-100 bg-gray-100 px-4 text-base font-bold text-gray-500"
                editable={false}
                placeholder="--"
                value={liveBmi > 0 ? liveBmi.toString() : ""}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-400 mb-1.5 ml-1">
                Status (Auto)
              </Text>
              <TextInput
                className={`h-12 rounded-xl border px-4 text-base font-bold ${
                  liveStatus === "Normal"
                    ? "bg-teal-50 border-teal-100 text-teal-700"
                    : liveStatus === "Overweight"
                      ? "bg-orange-50 border-orange-100 text-orange-700"
                      : liveStatus
                        ? "bg-red-50 border-red-100 text-red-700"
                        : "bg-gray-100 border-gray-100 text-gray-500"
                }`}
                editable={false}
                placeholder="--"
                value={liveStatus || ""}
              />
            </View>
          </View>

          {record?.status === "draft" && !liveStatus && (
            <View className="mb-4 rounded-xl bg-orange-50 p-3 border border-orange-100">
              <Text className="text-sm font-semibold text-orange-800">
                Draft saved: {record.weight}kg | {record.height}cm
              </Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => onSave(child._id, "draft")}
              disabled={isPending}
              className={`flex-1 items-center justify-center rounded-xl bg-gray-100 py-3 active:opacity-75 ${
                isPending ? "opacity-50" : ""
              }`}
            >
              <Text className="text-base font-bold text-gray-700">
                Save Draft
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(child._id, "submit")}
              disabled={isPending}
              className={`flex-1 flex-row items-center justify-center rounded-xl bg-teal-600 py-3 active:opacity-85 shadow-sm ${
                isPending ? "opacity-50" : ""
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="ml-2 text-base font-bold text-white">
                  Submit
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  useMyClassNutrition,
  useEvaluateNutrition,
} from "../hooks/useNutrition";

export const TeacherNutritionScreen = () => {
  const [schoolYear, setSchoolYear] = useState("2024-2025");
  const period = "final";

  const {
    data: students,
    isLoading,
    isError,
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
    setLocalInputs((prev) => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [field]: value,
      },
    }));
  };

  const handleSave = (childId: string, action: "draft" | "submit") => {
    const inputs = localInputs[childId];
    if (!inputs || !inputs.weight || !inputs.height) {
      alert("Please enter both weight and height.");
      return;
    }

    evaluateNutrition.mutate({
      childId,
      schoolYear,
      period,
      weight: parseFloat(inputs.weight),
      height: parseFloat(inputs.height),
      action,
    });
  };

  if (isLoading)
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  if (isError)
    return (
      <View style={{ padding: 20 }}>
        <Text>Error loading students.</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb", padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
        Class Nutritional Assessment ({period})
      </Text>

      <FlatList
        data={students}
        keyExtractor={(item) => item.child._id}
        renderItem={({ item }) => {
          const { child, record, initialRecord } = item;
          const isSubmitted = record?.status === "submitted";

          return (
            <View
              style={{
                backgroundColor: "white",
                padding: 16,
                marginBottom: 16,
                borderRadius: 8,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {child.firstName} {child.lastName}
              </Text>

              {initialRecord && (
                <Text style={{ fontSize: 12, color: "gray", marginBottom: 8 }}>
                  Initial: {initialRecord.weight}kg | {initialRecord.height}cm
                </Text>
              )}

              {isSubmitted ? (
                <View
                  style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: "#f0fdf4",
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: "#166534" }}>
                    Final Assessment Submitted
                  </Text>
                  <Text style={{ color: "#166534" }}>
                    Weight: {record.weight}kg | Height: {record.height}cm
                  </Text>
                  <Text style={{ color: "#166534" }}>
                    BMI: {record.bmi.toFixed(2)} ({record.nutritionalStatus})
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 8 }}>
                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, marginBottom: 4 }}>
                        Weight (kg)
                      </Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: "#ccc",
                          borderRadius: 4,
                          padding: 8,
                        }}
                        keyboardType="numeric"
                        placeholder={record?.weight?.toString() || "0.0"}
                        value={
                          localInputs[child._id]?.weight !== undefined
                            ? localInputs[child._id].weight
                            : record?.weight?.toString() || ""
                        }
                        onChangeText={(text) =>
                          handleInputChange(child._id, "weight", text)
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, marginBottom: 4 }}>
                        Height (cm)
                      </Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: "#ccc",
                          borderRadius: 4,
                          padding: 8,
                        }}
                        keyboardType="numeric"
                        placeholder={record?.height?.toString() || "0.0"}
                        value={
                          localInputs[child._id]?.height !== undefined
                            ? localInputs[child._id].height
                            : record?.height?.toString() || ""
                        }
                        onChangeText={(text) =>
                          handleInputChange(child._id, "height", text)
                        }
                      />
                    </View>
                  </View>

                  {record?.status === "draft" && (
                    <Text
                      style={{
                        color: "#854d0e",
                        marginBottom: 8,
                        fontSize: 12,
                      }}
                    >
                      Current Draft: {record.weight}kg | {record.height}cm |{" "}
                      {record.nutritionalStatus}
                    </Text>
                  )}

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleSave(child._id, "draft")}
                      style={{
                        flex: 1,
                        backgroundColor: "#f3f4f6",
                        padding: 12,
                        borderRadius: 4,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#374151", fontWeight: "bold" }}>
                        Save Draft
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSave(child._id, "submit")}
                      style={{
                        flex: 1,
                        backgroundColor: "#0284c7",
                        padding: 12,
                        borderRadius: 4,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        Submit Final
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

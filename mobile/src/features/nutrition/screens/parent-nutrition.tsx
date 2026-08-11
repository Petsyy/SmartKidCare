import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useChildNutritionHistory } from "../hooks/useNutrition";

export const ParentNutritionScreen = ({ route }: any) => {
  const { childId } = route.params;

  const {
    data: records,
    isLoading,
    isError,
  } = useChildNutritionHistory(childId);

  if (isLoading)
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  if (isError)
    return (
      <View style={{ padding: 20 }}>
        <Text>Error loading nutrition history.</Text>
      </View>
    );

  const initialRecord = records?.find((r: any) => r.period === "initial");
  const finalRecord = records?.find((r: any) => r.period === "final");

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb", padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
        Nutritional Progress
      </Text>

      {!initialRecord ? (
        <Text style={{ color: "gray" }}>No nutrition records found.</Text>
      ) : (
        <View style={{ gap: 16 }}>
          {/* Initial Record */}
          <View
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 8,
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Start of Year (Initial)
            </Text>
            <Text>Weight: {initialRecord.weight} kg</Text>
            <Text>Height: {initialRecord.height} cm</Text>
            <Text>BMI: {initialRecord.bmi.toFixed(2)}</Text>
            <View
              style={{
                marginTop: 8,
                alignSelf: "flex-start",
                backgroundColor: "#e0f2fe",
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
              }}
            >
              <Text
                style={{ color: "#0369a1", fontWeight: "bold", fontSize: 12 }}
              >
                {initialRecord.nutritionalStatus}
              </Text>
            </View>
          </View>

          {/* Final Record */}
          <View
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 8,
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              End of Year (Final)
            </Text>

            {finalRecord ? (
              <>
                <Text>Weight: {finalRecord.weight} kg</Text>
                <Text>Height: {finalRecord.height} cm</Text>
                <Text>BMI: {finalRecord.bmi.toFixed(2)}</Text>
                <View
                  style={{
                    marginTop: 8,
                    alignSelf: "flex-start",
                    backgroundColor: "#dcfce7",
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "#15803d",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {finalRecord.nutritionalStatus}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={{ color: "gray", fontStyle: "italic" }}>
                Pending final measurement...
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

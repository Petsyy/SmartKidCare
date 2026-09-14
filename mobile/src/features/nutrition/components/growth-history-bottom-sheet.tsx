import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { X, TrendingUp, Calendar, AlertCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChildNutritionHistory } from "../hooks/useNutrition";

interface GrowthHistoryBottomSheetProps {
  childId: string | null;
  childName: string;
  visible: boolean;
  onClose: () => void;
}

export function GrowthHistoryBottomSheet({
  childId,
  childName,
  visible,
  onClose,
}: GrowthHistoryBottomSheetProps) {
  const insets = useSafeAreaInsets();
  
  const { data: history, isLoading, error } = useChildNutritionHistory(
    childId || "",
  );

  // We only show submitted records in the history
  const submittedRecords = (history || []).filter(
    (record) => record.status === "submitted",
  );

  // The backend already sorts by measurementDate descending, but a timeline 
  // usually looks best from oldest (top) to newest (bottom).
  // Or newest at top? The plan didn't specify, but usually newest at top is better for quick reading.
  // We'll keep the backend sort (newest first). Let's actually reverse it to show Initial -> Final downward 
  // as the user asked for: Initial -> Quarterly -> Final in their arrow diagram!
  const timelineRecords = [...submittedRecords].reverse();

  const getRecordTitle = (period?: string) => {
    switch (period) {
      case "initial":
        return "Initial / Enrollment";
      case "quarterly":
        return "Quarterly Assessment";
      case "final":
        return "Final Assessment";
      default:
        return "Assessment";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        
        <View
          className="bg-gray-50 rounded-t-3xl pt-5 shadow-lg"
          style={{ maxHeight: "85%", paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="flex-row items-center justify-between mb-5 border-b border-gray-200/60 pb-3 px-5">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="h-10 w-10 rounded-xl bg-teal-100 items-center justify-center mr-3">
                <TrendingUp size={20} color="#0D9488" />
              </View>
              <View>
                <Text className="text-lg font-black text-gray-900">
                  Growth History
                </Text>
                <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
                  {childName}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 rounded-full bg-gray-200/80 items-center justify-center active:opacity-85"
            >
              <X size={18} color="#4B5563" />
            </Pressable>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          >
            {isLoading ? (
              <View className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-sm font-semibold text-gray-500">
                  Loading growth history...
                </Text>
              </View>
            ) : error ? (
              <View className="py-10 items-center justify-center">
                <AlertCircle size={32} color="#EF4444" />
                <Text className="mt-4 text-base font-bold text-gray-900 text-center">
                  Could not load history
                </Text>
                <Text className="mt-1 text-sm font-medium text-gray-500 text-center">
                  {error instanceof Error ? error.message : "Unknown error"}
                </Text>
              </View>
            ) : timelineRecords.length === 0 ? (
              <View className="py-10 items-center justify-center bg-white rounded-3xl border border-gray-100">
                <TrendingUp size={32} color="#9CA3AF" />
                <Text className="mt-4 text-base font-bold text-gray-900 text-center">
                  No records found
                </Text>
                <Text className="mt-1 text-sm font-medium text-gray-500 text-center">
                  Nutritional assessments will appear here.
                </Text>
              </View>
            ) : (
              <View className="pl-4 border-l-2 border-teal-200 ml-4 py-2">
                {timelineRecords.map((record, index) => (
                  <View key={record._id} className="mb-6 relative">
                    {/* Timeline Dot */}
                    <View className="absolute -left-[25px] top-4 h-4 w-4 rounded-full bg-teal-500 border-2 border-white shadow-sm" />
                    
                    {/* Record Card */}
                    <View className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <View className="flex-row items-center mb-3 border-b border-gray-100 pb-2">
                        <Calendar size={16} color="#0D9488" />
                        <Text className="ml-2 flex-1 font-bold text-gray-900 text-base">
                          {getRecordTitle(record.period)}
                        </Text>
                      </View>
                      
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        {record.measurementDate ? formatDate(record.measurementDate) : "Unknown Date"}
                      </Text>

                      <View className="flex-row mb-2">
                        <Text className="flex-1 font-semibold text-gray-600 text-sm">Weight</Text>
                        <Text className="flex-1 text-right font-extrabold text-gray-900 text-sm">{record.weight} kg</Text>
                      </View>
                      <View className="flex-row mb-2">
                        <Text className="flex-1 font-semibold text-gray-600 text-sm">Height</Text>
                        <Text className="flex-1 text-right font-extrabold text-gray-900 text-sm">{record.height} cm</Text>
                      </View>
                      <View className="flex-row mb-3">
                        <Text className="flex-1 font-semibold text-gray-600 text-sm">BMI</Text>
                        <Text className="flex-1 text-right font-extrabold text-gray-900 text-sm">{record.bmi.toFixed(2)}</Text>
                      </View>

                      <View className="flex-row items-center pt-2 border-t border-gray-50">
                        <Text className="flex-1 font-semibold text-gray-600 text-sm">Status</Text>
                        <View
                          className={`rounded-full px-3 py-1 ${
                            record.nutritionalStatus === "Normal"
                              ? "bg-emerald-50 border border-emerald-100"
                              : record.nutritionalStatus === "Overweight" || record.nutritionalStatus === "Obese"
                                ? "bg-orange-50 border border-orange-100"
                                : "bg-red-50 border border-red-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-extrabold ${
                              record.nutritionalStatus === "Normal"
                                ? "text-emerald-700"
                                : record.nutritionalStatus === "Overweight" || record.nutritionalStatus === "Obese"
                                  ? "text-orange-700"
                                  : "text-red-700"
                            }`}
                          >
                            {record.nutritionalStatus}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

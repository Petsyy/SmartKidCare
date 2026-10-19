import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import {
  X,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Activity,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChildNutritionHistory } from "../hooks/useNutrition";

interface GrowthHistoryBottomSheetProps {
  childId: string | null;
  childName: string;
  visible: boolean;
  onClose: () => void;
}

const getStatusConfig = (status?: string) => {
  const norm = (status || "").toLowerCase();
  if (norm === "normal") {
    return {
      label: "Normal",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-100",
      textClass: "text-emerald-700",
      description: "Healthy weight and height proportion for age.",
    };
  }
  if (norm.includes("overweight") || norm.includes("obese")) {
    return {
      label: status || "Overweight",
      bgClass: "bg-orange-50",
      borderClass: "border-orange-100",
      textClass: "text-orange-700",
      description:
        "Above typical weight for height. Active play and balanced meals encouraged.",
    };
  }
  if (norm.includes("underweight") || norm.includes("wasted")) {
    return {
      label: status || "Underweight",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-100",
      textClass: "text-amber-700",
      description:
        "Below typical weight for height. Supported by center meal monitoring.",
    };
  }
  return {
    label: status || "Recorded",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
    textClass: "text-gray-700",
    description: "Evaluated in accordance with child growth standards.",
  };
};

export function GrowthHistoryBottomSheet({
  childId,
  childName,
  visible,
  onClose,
}: GrowthHistoryBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const {
    data: history,
    isLoading,
    error,
  } = useChildNutritionHistory(childId || "");

  // We only show submitted records in the history
  const submittedRecords = useMemo(
    () => (history || []).filter((record) => record.status === "submitted"),
    [history],
  );

  // Chronological timeline from oldest (Initial) to newest (Final)
  const timelineRecords = useMemo(
    () => [...submittedRecords].reverse(),
    [submittedRecords],
  );

  const getRecordTitle = (period?: string) => {
    switch (period) {
      case "initial":
        return "Initial / Enrollment";
      case "quarterly":
        return "Quarterly Assessment";
      case "final":
        return "Final Assessment";
      default:
        return "Growth Assessment";
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
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close growth history"
        />

        <View
          className="rounded-t-3xl bg-gray-50 pt-5 shadow-lg"
          style={{
            maxHeight: "85%",
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between border-b border-gray-200/60 px-5 pb-3">
            <View className="flex-1 flex-row items-center pr-4">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                <TrendingUp size={20} color="#0D9488" />
              </View>
              <View>
                <Text className="text-lg font-black text-gray-900">
                  Growth History
                </Text>
                <Text
                  className="text-xs font-medium text-gray-500"
                  numberOfLines={1}
                >
                  {childName}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close growth history"
              className="h-8 w-8 items-center justify-center rounded-full bg-gray-200/80 active:opacity-85"
            >
              <X size={18} color="#4B5563" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          >
            {isLoading ? (
              <View className="items-center justify-center py-10">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-sm font-semibold text-gray-500">
                  Loading growth history...
                </Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center py-10">
                <AlertCircle size={32} color="#EF4444" />
                <Text className="mt-4 text-center text-base font-bold text-gray-900">
                  Could not load history
                </Text>
                <Text className="mt-1 text-center text-sm font-medium text-gray-500">
                  {error instanceof Error ? error.message : "Unknown error"}
                </Text>
              </View>
            ) : timelineRecords.length === 0 ? (
              <View className="items-center justify-center rounded-3xl border border-gray-100 bg-white py-10">
                <TrendingUp size={32} color="#9CA3AF" />
                <Text className="mt-4 text-center text-base font-bold text-gray-900">
                  No records found
                </Text>
                <Text className="mt-1 text-center text-sm font-medium text-gray-500">
                  Nutritional assessments will appear here.
                </Text>
              </View>
            ) : (
              <View className="ml-4 border-l-2 border-teal-200 py-2 pl-4">
                {timelineRecords.map((record, index) => {
                  const statusConfig = getStatusConfig(
                    record.nutritionalStatus,
                  );
                  const dateLabel = record.measurementDate
                    ? formatDate(record.measurementDate)
                    : "Unknown Date";

                  // Compare with previous assessment if available
                  const prevRecord =
                    index > 0 ? timelineRecords[index - 1] : null;
                  const weightDiff = prevRecord
                    ? record.weight - prevRecord.weight
                    : 0;
                  const heightDiff = prevRecord
                    ? record.height - prevRecord.height
                    : 0;

                  return (
                    <View key={record._id} className="relative mb-5">
                      {/* Timeline Dot */}
                      <View className="absolute -left-[25px] top-4 h-4 w-4 rounded-full border-2 border-white bg-teal-500 shadow-sm" />

                      {/* Record Card */}
                      <View className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* Header: Title, Date, and Status Badge */}
                        <View className="flex-row items-start justify-between">
                          <View className="mr-2 flex-1 flex-row items-center">
                            <View className="mr-2.5 h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                              <Activity size={18} color="#0D9488" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-base font-extrabold text-gray-900">
                                {getRecordTitle(record.period)}
                              </Text>
                              <View className="mt-0.5 flex-row items-center">
                                <Calendar size={12} color="#9CA3AF" />
                                <Text className="ml-1 text-xs font-medium text-gray-500">
                                  {dateLabel}
                                  {record.ageInMonths
                                    ? ` • ${record.ageInMonths} mos`
                                    : ""}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View
                            className={`rounded-full border px-2.5 py-1 ${statusConfig.bgClass} ${statusConfig.borderClass}`}
                          >
                            <Text
                              className={`text-[11px] font-extrabold ${statusConfig.textClass}`}
                            >
                              {statusConfig.label}
                            </Text>
                          </View>
                        </View>

                        {/* 3-Column Metrics Grid */}
                        <View className="mt-3.5 flex-row gap-2">
                          {/* Weight */}
                          <View className="flex-1 items-center rounded-xl border border-gray-100 bg-gray-50/80 p-2.5">
                            <Text className="text-[11px] font-semibold text-gray-500">
                              Weight
                            </Text>
                            <Text className="mt-0.5 text-base font-black text-gray-900">
                              {record.weight}{" "}
                              <Text className="text-xs font-semibold text-gray-500">
                                kg
                              </Text>
                            </Text>
                          </View>

                          {/* Height */}
                          <View className="flex-1 items-center rounded-xl border border-gray-100 bg-gray-50/80 p-2.5">
                            <Text className="text-[11px] font-semibold text-gray-500">
                              Height
                            </Text>
                            <Text className="mt-0.5 text-base font-black text-gray-900">
                              {record.height}{" "}
                              <Text className="text-xs font-semibold text-gray-500">
                                cm
                              </Text>
                            </Text>
                          </View>

                          {/* BMI */}
                          <View className="flex-1 items-center rounded-xl border border-gray-100 bg-gray-50/80 p-2.5">
                            <Text className="text-[11px] font-semibold text-gray-500">
                              BMI
                            </Text>
                            <Text className="mt-0.5 text-base font-black text-teal-700">
                              {Number(record.bmi).toFixed(1)}
                            </Text>
                          </View>
                        </View>

                        {/* Growth Comparison vs Previous Record */}
                        {prevRecord ? (
                          <View className="mt-3 flex-row items-center rounded-xl border border-teal-100/70 bg-teal-50/60 px-3 py-2">
                            <TrendingUp size={14} color="#0D9488" />
                            <Text className="ml-2 text-xs font-medium text-teal-900">
                              Since last check:{" "}
                              <Text className="font-bold text-teal-800">
                                {weightDiff >= 0
                                  ? `+${weightDiff.toFixed(1)}`
                                  : weightDiff.toFixed(1)}{" "}
                                kg
                              </Text>
                              {" • "}
                              <Text className="font-bold text-teal-800">
                                {heightDiff >= 0
                                  ? `+${heightDiff.toFixed(1)}`
                                  : heightDiff.toFixed(1)}{" "}
                                cm
                              </Text>
                            </Text>
                          </View>
                        ) : (
                          <View className="mt-3 flex-row items-center rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2">
                            <CheckCircle2 size={14} color="#6B7280" />
                            <Text className="ml-2 text-xs font-medium text-gray-600">
                              Baseline enrollment assessment
                            </Text>
                          </View>
                        )}

                        {/* Status Interpretation Guidance */}
                        <View className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                          <Text className="text-[11px] leading-4 text-gray-600">
                            {statusConfig.description}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

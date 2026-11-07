import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { HeartPulse, Ruler, Scale, Sparkles, TrendingUp } from "lucide-react-native";
import { EmptyStateCard, ProfileSection } from "@/src/components/ui";
import { useChildNutritionHistory } from "@/src/features/nutrition/hooks/useNutrition";

function NutritionRecordCard({
  title,
  record,
}: {
  title: string;
  record: any;
}) {
  const isNormal = record.nutritionalStatus === "Normal";
  const isOverweight = record.nutritionalStatus === "Overweight";

  const recordedDate = record.recordedAt || record.createdAt;
  const formattedDate = recordedDate
    ? new Date(recordedDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      })
    : null;

  return (
    <View className="mb-3.5 rounded-2xl border border-gray-100 bg-gray-50/90 p-4">
      {/* Header with Title and Nutritional Status Badge */}
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-gray-900">{title}</Text>
          {formattedDate ? (
            <Text className="mt-0.5 text-[11px] font-medium text-gray-400">
              Assessed on {formattedDate}
            </Text>
          ) : null}
        </View>

        <View
          className={`rounded-full px-2.5 py-1 ${
            isNormal
              ? "border border-emerald-200 bg-emerald-100"
              : isOverweight
                ? "border border-amber-200 bg-amber-100"
                : "border border-red-200 bg-red-100"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isNormal
                ? "text-emerald-800"
                : isOverweight
                  ? "text-amber-800"
                  : "text-red-800"
            }`}
          >
            {record.nutritionalStatus}
          </Text>
        </View>
      </View>

      {/* 3 Glanceable Metric Tiles: Weight, Height, BMI */}
      <View className="flex-row gap-2">
        <View className="flex-1 items-center rounded-xl border border-gray-100 bg-white p-2.5 shadow-2xs">
          <View className="mb-1 flex-row items-center gap-1">
            <Scale size={12} color="#0284C7" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Weight
            </Text>
          </View>
          <Text className="text-sm font-extrabold text-gray-900">
            {record.weight} kg
          </Text>
        </View>

        <View className="flex-1 items-center rounded-xl border border-gray-100 bg-white p-2.5 shadow-2xs">
          <View className="mb-1 flex-row items-center gap-1">
            <Ruler size={12} color="#4F46E5" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Height
            </Text>
          </View>
          <Text className="text-sm font-extrabold text-gray-900">
            {record.height} cm
          </Text>
        </View>

        <View className="flex-1 items-center rounded-xl border border-gray-100 bg-white p-2.5 shadow-2xs">
          <View className="mb-1 flex-row items-center gap-1">
            <Sparkles size={12} color="#0D9488" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              BMI
            </Text>
          </View>
          <Text className="text-sm font-extrabold text-gray-900">
            {Number(record.bmi).toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export interface ParentNutritionSectionProps {
  childId: string;
  schoolYear?: string;
  onOpenGrowthHistory: () => void;
}

export function ParentNutritionSection({
  childId,
  schoolYear,
  onOpenGrowthHistory,
}: ParentNutritionSectionProps) {
  const { data: history, isLoading } = useChildNutritionHistory(childId);

  if (isLoading) {
    return (
      <ProfileSection
        icon={<HeartPulse size={22} color="#047857" />}
        title="Health & Nutrition"
        tone="emerald"
      >
        <View className="items-center py-6">
          <ActivityIndicator color="#047857" />
        </View>
      </ProfileSection>
    );
  }

  const records = history || [];
  const currentRecords = schoolYear
    ? records.filter(
        (r: any) => r.schoolYear === schoolYear && r.status === "submitted",
      )
    : records.filter((r: any) => r.status === "submitted");

  const initialRecord = currentRecords.find((r: any) => r.period === "initial");
  const finalRecord = currentRecords.find((r: any) => r.period === "final");

  return (
    <ProfileSection
      icon={<HeartPulse size={22} color="#047857" />}
      title="Health & Nutrition"
      tone="emerald"
    >
      <View className="px-1 pb-1 pt-2">
        {!initialRecord && !finalRecord ? (
          <View className="py-2">
            <EmptyStateCard
              icon={HeartPulse}
              title="No Assessments Yet"
              description="No nutritional assessments recorded yet for the current school year."
            />
          </View>
        ) : (
          <>
            {initialRecord && (
              <NutritionRecordCard
                title="Initial Assessment"
                record={initialRecord}
              />
            )}
            {finalRecord && (
              <NutritionRecordCard
                title="Final Assessment"
                record={finalRecord}
              />
            )}

            {/* Quick Link to Growth Charts */}
            <Pressable
              onPress={onOpenGrowthHistory}
              accessibilityRole="button"
              accessibilityLabel="View full growth history"
              className="mt-1 flex-row items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/70 py-2.5 active:bg-emerald-100"
            >
              <TrendingUp size={15} color="#047857" />
              <Text className="ml-1.5 text-xs font-bold text-emerald-800">
                View Full Growth Chart & History →
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ProfileSection>
  );
}


import { View, Text, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  EmptyStateCard,
} from "@/src/components/ui";
import { useTeacherNutrition } from "../hooks";
import {
  StudentNutritionCard,
  NutritionDatePicker,
  NutritionPeriodTabs,
} from "../components";
import { formatManilaDateLabel } from "@/src/utils/manila-date";
import { useAndroidBackRoute } from "@/src/hooks/use-android-back-route";
import { nutritionInputKey } from "../utils";

export const TeacherNutritionScreen = () => {
  const router = useRouter();
  useAndroidBackRoute("/(teacher)");

  const {
    schoolYear,
    period,
    setPeriod,
    measurementDateKey,
    setMeasurementDateKey,
    students,
    isLoading,
    isError,
    error,
    isOffline,
    unavailableOffline,
    localInputs,
    localDraftKeys,
    fieldErrors,
    isPending,
    submittingChildId,
    handleInputChange,
    handleSave,
  } = useTeacherNutrition();

  if (isLoading) {
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Nutrition Assessment"
          onBack={() => router.replace("/(teacher)")}
        />
        <ScreenLoadingState
          title="Loading nutrition records"
          message="Getting your class nutrition assessments ready."
        />
      </ScreenShell>
    );
  }

  if (unavailableOffline) {
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Nutrition Assessment"
          onBack={() => router.replace("/(teacher)")}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-base font-semibold text-gray-700">
            This form is unavailable offline. Connect to the internet to load it
            first.
          </Text>
        </View>
      </ScreenShell>
    );
  }

  if (isError) {
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Nutrition Assessment"
          onBack={() => router.replace("/(teacher)")}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="mb-2 text-xl font-bold text-red-600">
            Error loading students
          </Text>
          <Text className="text-center text-gray-600">
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Nutrition Assessment"
        subtitle={`Class List (${schoolYear})`}
        onBack={() => router.replace("/(teacher)")}
      />

      <View className="flex-1 bg-gray-50">
        <NutritionDatePicker
          dateKey={measurementDateKey}
          dateLabel={formatManilaDateLabel(measurementDateKey)}
          onDateChange={setMeasurementDateKey}
        />

        <NutritionPeriodTabs
          period={period}
          onSelectPeriod={setPeriod}
        />

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
          renderItem={({ item }) => {
            const inputKey = nutritionInputKey(
              item.child._id,
              period,
              measurementDateKey,
            );
            return (
              <StudentNutritionCard
                child={item.child}
                record={item.selectedRecord}
                latestRecord={item.record}
                initialRecord={item.initialRecord}
                period={period}
                localInput={localInputs[inputKey]}
                hasLocalDraft={Boolean(localDraftKeys[inputKey])}
                isOffline={isOffline}
                errors={fieldErrors[inputKey]}
                isPending={isPending}
                isSubmitting={isPending && submittingChildId === item.child._id}
                onSave={(childId, action) => void handleSave(childId, action)}
                onInputChange={handleInputChange}
              />
            );
          }}
        />
      </View>
    </ScreenShell>
  );
};

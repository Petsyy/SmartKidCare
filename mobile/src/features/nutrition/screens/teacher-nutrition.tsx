import React, { useEffect, useState } from "react";
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
import { NutritionDatePicker } from "../components/nutrition-date-picker";
import type { NutritionPeriod } from "@/src/api/nutrition.api";
import {
  getManilaDateKey,
  formatManilaDateLabel,
} from "@/src/utils/manila-date";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import {
  deleteScopedDraft,
  getScopedDraft,
  saveScopedDraft,
} from "@/src/offline/offline-store";
import type { NutritionDraftPayload } from "@/src/offline/offline.types";
import {
  validateNutritionAssessment,
  type NutritionAssessmentErrors,
} from "../validations/nutrition-assessment.validation";

const getCurrentSchoolYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, so June = 5
  return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

type EditableNutritionPeriod = Extract<NutritionPeriod, "quarterly" | "final">;

const nutritionDraftScopeKey = (
  childId: string,
  schoolYear: string,
  period: EditableNutritionPeriod,
) => `${schoolYear}:${period}:${childId}`;

export const TeacherNutritionScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, isInternetReachable, refreshPendingCount } =
    useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  const schoolYear = getCurrentSchoolYear();
  const [period, setPeriod] = useState<EditableNutritionPeriod>("quarterly");
  const [measurementDateKey, setMeasurementDateKey] = useState(() =>
    getManilaDateKey(),
  );
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
  const [localDraftKeys, setLocalDraftKeys] = useState<Record<string, boolean>>(
    {},
  );
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, NutritionAssessmentErrors>
  >({});

  useEffect(() => {
    if (!user?.id || !students?.length) return;
    let cancelled = false;
    void (async () => {
      const nextInputs: Record<string, { weight: string; height: string }> = {};
      const nextDraftKeys: Record<string, boolean> = {};
      let restoredDateKey: string | null = null;

      for (const item of students) {
        const childId = item.child._id;
        const inputKey = `${period}:${childId}`;
        const draft = await getScopedDraft(
          user.id,
          "nutrition",
          nutritionDraftScopeKey(childId, schoolYear, period),
        );
        if (!draft) continue;
        const payload = draft.payload as NutritionDraftPayload;
        nextInputs[inputKey] = {
          weight: payload.weight ?? "",
          height: payload.height ?? "",
        };
        nextDraftKeys[inputKey] = true;
        restoredDateKey ??= payload.measurementDateKey;
      }

      if (cancelled) return;
      if (Object.keys(nextInputs).length > 0) {
        setLocalInputs((current) => ({ ...current, ...nextInputs }));
        setLocalDraftKeys((current) => ({ ...current, ...nextDraftKeys }));
      }
      if (restoredDateKey) setMeasurementDateKey(restoredDateKey);
    })();
    return () => {
      cancelled = true;
    };
  }, [period, schoolYear, students, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const timeout = setTimeout(() => {
      void Promise.all(
        Object.entries(localInputs).map(([inputKey, inputs]) => {
          const [inputPeriod, childId] = inputKey.split(":");
          if (inputPeriod !== period || !childId) return Promise.resolve();
          if (!inputs?.weight && !inputs?.height) return Promise.resolve();
          const payload: NutritionDraftPayload = {
            childId,
            schoolYear,
            period,
            measurementDateKey,
            weight: inputs.weight ?? "",
            height: inputs.height ?? "",
          };
          return saveScopedDraft({
            userId: user.id,
            recordType: "nutrition",
            dateKey: `${schoolYear}-${period}`,
            draftScopeKey: nutritionDraftScopeKey(childId, schoolYear, period),
            payload,
          });
        }),
      ).then(() => refreshPendingCount());
    }, 600);
    return () => clearTimeout(timeout);
  }, [
    localInputs,
    measurementDateKey,
    period,
    refreshPendingCount,
    schoolYear,
    user?.id,
  ]);

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

    setFieldErrors((prev) => {
      const current = prev[inputKey];
      if (!current?.[field]) return prev;
      const { [field]: _, ...remaining } = current;
      return { ...prev, [inputKey]: remaining };
    });
  };

  const saveLocalDraft = async (
    childId: string,
    inputs: { weight?: string; height?: string } | undefined,
  ) => {
    if (!user?.id) throw new Error("Please sign in again to save drafts.");
    const inputKey = `${period}:${childId}`;
    const payload: NutritionDraftPayload = {
      childId,
      schoolYear,
      period,
      measurementDateKey,
      weight: inputs?.weight ?? "",
      height: inputs?.height ?? "",
    };
    await saveScopedDraft({
      userId: user.id,
      recordType: "nutrition",
      dateKey: `${schoolYear}-${period}`,
      draftScopeKey: nutritionDraftScopeKey(childId, schoolYear, period),
      payload,
    });
    setLocalDraftKeys((prev) => ({ ...prev, [inputKey]: true }));
    await refreshPendingCount();
  };

  const handleSave = async (childId: string, action: "draft" | "submit") => {
    const inputKey = `${period}:${childId}`;
    const inputs = localInputs[inputKey];

    if (action === "draft") {
      try {
        await saveLocalDraft(childId, inputs);
        const errors = validateNutritionAssessment({
          weight: inputs?.weight ?? "",
          height: inputs?.height ?? "",
        });
        if (Object.keys(errors).length > 0 || isOffline) {
          Alert.alert(
            "Draft saved on this device",
            "You can return to this draft later on this device.",
          );
          return;
        }
      } catch (err) {
        Alert.alert(
          "Unable to Save",
          err instanceof Error ? err.message : "Failed to save draft.",
        );
        return;
      }
    }

    if (action === "submit" && isOffline) {
      Alert.alert(
        "Internet Required",
        "Connect to the internet to submit this assessment.",
      );
      return;
    }

    const errors = validateNutritionAssessment({
      weight: inputs?.weight ?? "",
      height: inputs?.height ?? "",
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, [inputKey]: errors }));
      return;
    }

    if (action === "submit") {
      try {
        await saveLocalDraft(childId, inputs);
      } catch (err) {
        Alert.alert(
          "Unable to Save",
          err instanceof Error ? err.message : "Failed to save assessment.",
        );
        return;
      }
    }

    setFieldErrors((prev) => ({ ...prev, [inputKey]: {} }));

    evaluateNutrition.mutate(
      {
        childId,
        schoolYear,
        period,
        measurementDate: new Date(
          `${measurementDateKey}T12:00:00+08:00`,
        ).toISOString(),
        weight: parseFloat(inputs.weight),
        height: parseFloat(inputs.height),
        action,
      },
      {
        onSuccess: async () => {
          if (action === "submit" && user?.id) {
            await deleteScopedDraft(
              user.id,
              "nutrition",
              nutritionDraftScopeKey(childId, schoolYear, period),
            );
            setLocalDraftKeys((prev) => ({ ...prev, [inputKey]: false }));
            await refreshPendingCount();
          }
          Alert.alert(
            action === "submit"
              ? "Assessment Submitted"
              : "Draft saved on this device",
            action === "submit"
              ? "The nutritional measurement has been submitted."
              : "You can return to this draft later on this device.",
          );
        },
        onError: (err) => {
          Alert.alert("Error", err.message || "Failed to save assessment.");
        },
      },
    );
  };

  const unavailableOffline = isOffline && isError;

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

  if (unavailableOffline)
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Nutrition Assessment"
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-base font-semibold text-gray-700">
            This form is unavailable offline. Connect to the internet to load it
            first.
          </Text>
        </View>
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
        <NutritionDatePicker
          dateKey={measurementDateKey}
          dateLabel={formatManilaDateLabel(measurementDateKey)}
          onDateChange={setMeasurementDateKey}
        />
        <View className="mx-6 mt-2 flex-row rounded-2xl border border-gray-200 bg-white p-1">
          {(["quarterly", "final"] as EditableNutritionPeriod[]).map(
            (option) => {
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
                    {option === "quarterly" ? "Quarterly" : "Final"}
                  </Text>
                </Pressable>
              );
            },
          )}
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
              hasLocalDraft={Boolean(
                localDraftKeys[`${period}:${item.child._id}`],
              )}
              isOffline={isOffline}
              errors={fieldErrors[`${period}:${item.child._id}`]}
              isPending={evaluateNutrition.isPending}
              isSubmitting={
                evaluateNutrition.isPending &&
                evaluateNutrition.variables?.childId === item.child._id
              }
              onSave={(childId, action) => void handleSave(childId, action)}
              onInputChange={handleInputChange}
            />
          )}
        />
      </View>
    </ScreenShell>
  );
};

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
import { useAndroidBackRoute } from "@/src/hooks/use-android-back-route";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";

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
  measurementDateKey: string,
) => `${schoolYear}:${period}:${measurementDateKey}:${childId}`;

const nutritionInputKey = (
  childId: string,
  period: EditableNutritionPeriod,
  measurementDateKey: string,
) => `${period}:${measurementDateKey}:${childId}`;

const legacyNutritionDraftScopeKey = (
  childId: string,
  schoolYear: string,
  period: EditableNutritionPeriod,
) => `${schoolYear}:${period}:${childId}`;

export const TeacherNutritionScreen = () => {
  const router = useRouter();
  useAndroidBackRoute("/(teacher)");
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
  } = useMyClassNutrition(schoolYear, period, measurementDateKey);
  const evaluateNutrition = useEvaluateNutrition();

  const [localInputs, setLocalInputs] = useState<
    Record<string, { weight: string; height: string }>
  >({});
  const [localDraftKeys, setLocalDraftKeys] = useState<Record<string, boolean>>(
    {},
  );
  const [legacyDraftKeys, setLegacyDraftKeys] = useState<
    Record<string, boolean>
  >({});
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, NutritionAssessmentErrors>
  >({});

  useEffect(() => {
    if (!user?.id || !students?.length) return;
    let cancelled = false;
    void (async () => {
      const nextInputs: Record<string, { weight: string; height: string }> = {};
      const nextDraftKeys: Record<string, boolean> = {};
      const nextLegacyDraftKeys: Record<string, boolean> = {};
      for (const item of students) {
        const childId = item.child._id;
        const inputKey = nutritionInputKey(childId, period, measurementDateKey);
        let draft = await getScopedDraft(
          user.id,
          "nutrition",
          nutritionDraftScopeKey(
            childId,
            schoolYear,
            period,
            measurementDateKey,
          ),
        );
        if (!draft) {
          const legacyDraft = await getScopedDraft(
            user.id,
            "nutrition",
            legacyNutritionDraftScopeKey(childId, schoolYear, period),
          );
          const legacyPayload = legacyDraft?.payload as
            NutritionDraftPayload | undefined;
          if (legacyPayload?.measurementDateKey === measurementDateKey) {
            draft = legacyDraft;
            nextLegacyDraftKeys[inputKey] = true;
          }
        }
        if (!draft) continue;
        const payload = draft.payload as NutritionDraftPayload;
        nextInputs[inputKey] = {
          weight: payload.weight ?? "",
          height: payload.height ?? "",
        };
        nextDraftKeys[inputKey] = true;
      }

      if (cancelled) return;
      if (Object.keys(nextInputs).length > 0) {
        setLocalInputs((current) => ({ ...current, ...nextInputs }));
        setLocalDraftKeys((current) => ({ ...current, ...nextDraftKeys }));
        setLegacyDraftKeys((current) => ({
          ...current,
          ...nextLegacyDraftKeys,
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [measurementDateKey, period, schoolYear, students, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const timeout = setTimeout(() => {
      void Promise.all(
        Object.entries(localInputs).map(([inputKey, inputs]) => {
          const [inputPeriod, inputDateKey, childId] = inputKey.split(":");
          if (
            inputPeriod !== period ||
            inputDateKey !== measurementDateKey ||
            !childId
          )
            return Promise.resolve();
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
            draftScopeKey: nutritionDraftScopeKey(
              childId,
              schoolYear,
              period,
              measurementDateKey,
            ),
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
    const inputKey = nutritionInputKey(childId, period, measurementDateKey);
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
    const inputKey = nutritionInputKey(childId, period, measurementDateKey);
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
      draftScopeKey: nutritionDraftScopeKey(
        childId,
        schoolYear,
        period,
        measurementDateKey,
      ),
      payload,
    });
    setLocalDraftKeys((prev) => ({ ...prev, [inputKey]: true }));
    await refreshPendingCount();
  };

  const handleSave = async (childId: string, action: "draft" | "submit") => {
    const inputKey = nutritionInputKey(childId, period, measurementDateKey);
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
        reportHandledError("nutrition.draft.save", err);
        Alert.alert(
          "Unable to Save",
          getUserFriendlyErrorMessage(
            err,
            "The draft could not be saved on this device.",
          ),
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
        reportHandledError("nutrition.assessment.stage", err);
        Alert.alert(
          "Unable to Save",
          getUserFriendlyErrorMessage(
            err,
            "The assessment could not be prepared. Please try again.",
          ),
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
              nutritionDraftScopeKey(
                childId,
                schoolYear,
                period,
                measurementDateKey,
              ),
            );
            if (legacyDraftKeys[inputKey]) {
              await deleteScopedDraft(
                user.id,
                "nutrition",
                legacyNutritionDraftScopeKey(childId, schoolYear, period),
              );
            }
            setLocalDraftKeys((prev) => ({ ...prev, [inputKey]: false }));
            setLegacyDraftKeys((prev) => ({ ...prev, [inputKey]: false }));
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
          reportHandledError("nutrition.assessment.save", err);
          Alert.alert(
            "Unable to Save Assessment",
            getUserFriendlyErrorMessage(
              err,
              "The assessment could not be saved. Please try again.",
            ),
          );
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
          onBack={() => router.replace("/(teacher)")}
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

  if (isError)
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Nutrition Assessment"
          onBack={() => router.replace("/(teacher)")}
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
        onBack={() => router.replace("/(teacher)")}
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
              record={item.selectedRecord}
              latestRecord={item.record}
              initialRecord={item.initialRecord}
              period={period}
              localInput={
                localInputs[
                  nutritionInputKey(item.child._id, period, measurementDateKey)
                ]
              }
              hasLocalDraft={Boolean(
                localDraftKeys[
                  nutritionInputKey(item.child._id, period, measurementDateKey)
                ],
              )}
              isOffline={isOffline}
              errors={
                fieldErrors[
                  nutritionInputKey(item.child._id, period, measurementDateKey)
                ]
              }
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

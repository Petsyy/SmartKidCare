import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ClipboardCheck, CheckCircle2, Lock } from "lucide-react-native";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "../../../components/ui";
import { CompetencyItem } from "../components/competency-item";
import { COMPETENCY_LEVELS } from "../constants";
import {
  useCompetencyEvaluation,
  type EvaluationPeriod,
} from "../hooks/useCompetencyEvaluation";
import { useUnsavedChangesGuard } from "../../../hooks/use-unsaved-changes-guard";

export default function CompetencyEvaluationScreen() {
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = typeof params.childId === "string" ? params.childId : null;
  const evaluation = useCompetencyEvaluation(childId);
  const child = evaluation.data?.child;

  useUnsavedChangesGuard({
    hasUnsavedChanges: evaluation.hasUnsavedChanges,
    isSaving: evaluation.isSubmitting,
    onSave: evaluation.saveDraft,
  });

  const periods: { value: EvaluationPeriod; label: string }[] = [
    { value: "initial", label: "Initial" },
    { value: "midyear", label: "Mid-Year" },
    { value: "final", label: "Final" },
  ];

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Competency Evaluation"
        subtitle={
          child
            ? `${child.firstName} ${child.lastName}`
            : "Individual skill checklist"
        }
        onBack={() => router.back()}
      />
      {evaluation.isLoading ? (
        <ScreenLoadingState
          title="Loading competencies"
          message="Getting this child’s skill checklist ready."
        />
      ) : evaluation.error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-red-600">
            {evaluation.error.message}
          </Text>
          <Pressable
            onPress={() => evaluation.refetch()}
            className="mt-4 rounded-xl bg-teal-600 px-5 py-3"
          >
            <Text className="font-bold text-white">Try Again</Text>
          </Pressable>
        </View>
      ) : evaluation.groupedDefinitions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <ClipboardCheck size={42} color="#9CA3AF" />
          <Text className="mt-3 text-center text-base text-gray-500">
            No competency checklist is configured.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-600">
              Evaluation Progress
            </Text>
            <View className="flex-row gap-2">
              {periods.map((period, index) => {
                const selected = evaluation.selectedPeriod === period.value;
                const state = evaluation.periodStates[period.value];
                return (
                  <Pressable
                    key={period.value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected, disabled: state.isLocked }}
                    accessibilityLabel={`${period.label} evaluation${state.isLocked ? ", locked" : state.isSubmitted ? ", submitted" : ", available"}`}
                    accessibilityHint={
                      state.isLocked
                        ? `Submit the ${state.prerequisiteLabel} evaluation first`
                        : `Open the ${period.label} evaluation`
                    }
                    onPress={() => evaluation.handlePeriodChange(period.value)}
                    className={`min-h-20 flex-1 items-center justify-center rounded-2xl border px-1 py-3 ${
                      selected
                        ? "border-teal-500 bg-teal-50"
                        : state.isLocked
                          ? "border-gray-200 bg-gray-50"
                          : state.isSubmitted
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-gray-200 bg-white"
                    }`}
                    style={selected ? periodTabSelectedStyle : undefined}
                  >
                    <View
                      className={`mb-1 h-7 w-7 items-center justify-center rounded-full ${
                        state.isLocked
                          ? "bg-gray-200"
                          : state.isSubmitted
                            ? "bg-emerald-100"
                            : "bg-teal-100"
                      }`}
                    >
                      {state.isLocked ? (
                        <Lock size={14} color="#6B7280" />
                      ) : state.isSubmitted ? (
                        <CheckCircle2 size={16} color="#059669" />
                      ) : (
                        <Text className="text-xs font-extrabold text-teal-700">
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      className={`text-xs font-bold ${
                        selected
                          ? "text-teal-800"
                          : state.isLocked
                            ? "text-gray-400"
                            : state.isSubmitted
                              ? "text-emerald-700"
                              : "text-gray-700"
                      }`}
                    >
                      {period.label}
                    </Text>
                    <Text
                      className={`mt-0.5 text-[10px] font-medium ${state.isLocked ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {state.isLocked
                        ? "Locked"
                        : state.isSubmitted
                          ? "Submitted"
                          : "Available"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {evaluation.selectedPeriodState.isLocked && (
            <View className="mb-4 flex-row rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                <Lock size={18} color="#B45309" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-amber-900">
                  Evaluation locked
                </Text>
                <Text className="mt-1 text-sm leading-5 text-amber-800">
                  Submit the {evaluation.selectedPeriodState.prerequisiteLabel}{" "}
                  evaluation to continue.
                </Text>
              </View>
            </View>
          )}

          <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-teal-50 px-4 py-3 border border-teal-100">
            <Text className="font-semibold text-teal-800">
              Checklist Progress
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Text className="font-bold text-teal-700">
                {evaluation.progress.completed} of {evaluation.progress.total}
              </Text>
              {evaluation.progress.isComplete && (
                <CheckCircle2 size={16} color="#0F766E" />
              )}
            </View>
          </View>

          {evaluation.isReadOnly && (
            <View className="mb-4 rounded-xl bg-amber-50 p-3 border border-amber-200">
              <Text className="text-center text-sm font-semibold text-amber-800">
                This evaluation has been submitted and is now read-only.
              </Text>
            </View>
          )}

          {evaluation.groupedDefinitions.map(([category, definitions]) => (
            <View
              key={category}
              className="mb-4 rounded-3xl border border-gray-200 bg-white p-4"
            >
              <Text className="text-xl font-extrabold text-gray-900">
                {category}
              </Text>
              {definitions.map((definition) => (
                <CompetencyItem
                  key={definition._id}
                  definition={definition}
                  level={evaluation.levels[definition._id]}
                  remarks={evaluation.remarks[definition._id] || ""}
                  disabled={evaluation.isSubmitting || evaluation.isReadOnly}
                  onLevelChange={(level) =>
                    evaluation.setLevel(definition._id, level)
                  }
                  onRemarksChange={(value) =>
                    evaluation.setRemark(definition._id, value)
                  }
                />
              ))}
            </View>
          ))}

          <View className="mb-4 rounded-3xl border border-gray-200 bg-white p-4">
            <Text className="text-base font-bold text-gray-900">
              General Notes
            </Text>
            <TextInput
              value={evaluation.generalNotes}
              onChangeText={evaluation.setGeneralNotes}
              editable={!evaluation.isSubmitting && !evaluation.isReadOnly}
              maxLength={1000}
              multiline
              placeholder="Optional overall observations"
              placeholderTextColor="#9CA3AF"
              className="mt-3 min-h-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-base text-gray-900"
            />
          </View>

          <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-4">
            <Text className="mb-3 text-base font-bold text-gray-900">
              Automatic Summary
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-2">
              {COMPETENCY_LEVELS.map((level) => (
                <View
                  key={level.value}
                  className="w-[48%] flex-row justify-between rounded-xl bg-gray-50 p-3 border border-gray-100"
                >
                  <Text className="text-sm font-medium text-gray-600">
                    {level.label}
                  </Text>
                  <Text className="text-sm font-bold text-gray-900">
                    {evaluation.summary[
                      level.value as keyof typeof evaluation.summary
                    ] || 0}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {!evaluation.isReadOnly && (
            <View className="gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={evaluation.isSubmitting}
                onPress={evaluation.saveDraft}
                className={`min-h-14 items-center justify-center rounded-2xl border-2 ${evaluation.isSubmitting ? "border-gray-300 bg-gray-100" : "border-teal-600 bg-white"}`}
              >
                <Text
                  className={`text-lg font-bold ${evaluation.isSubmitting ? "text-gray-400" : "text-teal-700"}`}
                >
                  Save Draft
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={
                  evaluation.isSubmitting || !evaluation.progress.isComplete
                }
                onPress={evaluation.submitEvaluation}
                className={`min-h-14 items-center justify-center rounded-2xl ${evaluation.isSubmitting || !evaluation.progress.isComplete ? "bg-gray-300" : "bg-teal-600"}`}
              >
                {evaluation.isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-lg font-bold text-white">
                    Submit Evaluation
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

const periodTabSelectedStyle = {
  backgroundColor: "#FFFFFF",
  elevation: 2,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 2,
} as const;

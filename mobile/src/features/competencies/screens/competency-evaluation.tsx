import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { ClipboardCheck, CheckCircle2, Lock, History } from "lucide-react-native";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "../../../components/ui";
import {
  useCompetencyEvaluation,
  type EvaluationPeriod,
} from "../hooks/useCompetencyEvaluation";
import { useUnsavedChangesGuard } from "../../../hooks/use-unsaved-changes-guard";
import { useAndroidBackRoute } from "../../../hooks/use-android-back-route";
import { useSafeBack } from "../../../hooks/use-safe-back";
import {
  CompetencyDatePicker,
  CompetencyHistoryBottomSheet,
  CompetencyPeriodTabs,
  CompetencyFinalizedBanner,
  CompetencyCategorySection,
  CompetencySummaryCard,
  CompetencyActionButtons,
} from "../components";

export default function CompetencyEvaluationScreen() {
  const params = useLocalSearchParams<{
    childId?: string;
    isParentView?: string;
    queueMode?: string;
    period?: EvaluationPeriod;
    date?: string;
    queueIds?: string;
  }>();
  const router = useRouter();
  const childId = typeof params.childId === "string" ? params.childId : null;
  const isParentView = params.isParentView === "true";
  const isQueueMode = params.queueMode === "true" && !isParentView;
  const queueIds = (params.queueIds || "").split(",").filter(Boolean);
  const queueIndex = childId ? queueIds.indexOf(childId) : -1;
  const nextChildId = queueIndex >= 0 ? queueIds[queueIndex + 1] : undefined;
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const fallbackRoute: Href = isParentView
    ? "/(parent)/children"
    : childId
      ? {
          pathname: "/(teacher)/child-details/[id]",
          params: { id: childId },
        }
      : "/(teacher)/children";
  const handleBack = useSafeBack(fallbackRoute);
  useAndroidBackRoute("/(parent)/children", isParentView);

  const evaluation = useCompetencyEvaluation(childId, {
    isParentView,
    initialPeriod: params.period,
    initialDate: params.date,
  });
  const child = evaluation.data?.child;

  useUnsavedChangesGuard({
    hasUnsavedChanges: evaluation.hasUnsavedChanges,
    isSaving: evaluation.isSubmitting,
    onSave: evaluation.saveDraft,
    fallbackRoute,
  });

  const handleSubmitEvaluation = () => {
    void (async () => {
      const submitted = await evaluation.submitEvaluation();
      if (!submitted || !isQueueMode) return;
      if (nextChildId) {
        router.replace({
          pathname: "/(teacher)/child-details/competencies/[childId]",
          params: {
            childId: nextChildId,
            queueMode: "true",
            period: evaluation.selectedPeriod,
            date: evaluation.evaluationDate,
            queueIds: queueIds.join(","),
          },
        });
      } else {
        router.replace("/(teacher)/teacher-record-data/competencies");
      }
    })();
  };

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
        onBack={handleBack}
        rightAction={
          <Pressable
            onPress={() => setIsHistoryVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="View evaluation timeline"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <History size={20} color="white" />
          </Pressable>
        }
      />

      {evaluation.isLoading ? (
        <ScreenLoadingState
          variant="form"
          title="Loading competencies"
          message="Getting this child’s skill checklist ready."
        />
      ) : evaluation.error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-red-600">
            {evaluation.isOffline
              ? "This form is unavailable offline. Connect to the internet to load it first."
              : evaluation.error.message}
          </Text>
          {!evaluation.isOffline && (
            <Pressable
              onPress={() => evaluation.refetch()}
              className="mt-4 rounded-xl bg-teal-600 px-5 py-3 active:bg-teal-700"
            >
              <Text className="font-bold text-white">Try Again</Text>
            </Pressable>
          )}
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
          {/* Progress / Period Tabs */}
          <CompetencyPeriodTabs
            selectedPeriod={evaluation.selectedPeriod}
            periodStates={evaluation.periodStates}
            onPeriodChange={evaluation.handlePeriodChange}
            disabled={isQueueMode}
          />

          {/* Date Picker */}
          <CompetencyDatePicker
            dateKey={evaluation.evaluationDate}
            dateLabel={evaluation.evaluationDateLabel}
            disabled={
              evaluation.isSubmitting ||
              evaluation.isReadOnly ||
              evaluation.isFinalized ||
              isQueueMode
            }
            onDateChange={evaluation.setEvaluationDate}
          />

          {/* Queue mode indicator */}
          {isQueueMode && queueIndex >= 0 ? (
            <View className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
              <Text className="font-bold text-blue-800">
                Child {queueIndex + 1} of {queueIds.length}
              </Text>
              <Text className="mt-1 text-sm text-blue-700">
                Submit this evaluation to continue to the next child.
              </Text>
            </View>
          ) : null}

          {/* Period Locked Advisory */}
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

          {/* Checklist Counter Strip */}
          <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
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

          {/* Finalized Banner */}
          <CompetencyFinalizedBanner
            isFinalized={evaluation.isFinalized}
            isEditing={evaluation.isEditing}
            isParentView={isParentView}
            canEditFinalized={evaluation.canEditFinalized}
            evaluationDateLabel={evaluation.evaluationDateLabel}
            onStartEditing={evaluation.startEditing}
            onStartNewEvaluation={evaluation.startNewEvaluation}
            onCancelEditing={evaluation.cancelEditing}
          />

          {/* Offline Draft Badge */}
          {evaluation.hasLocalDraft && !evaluation.isReadOnly && (
            <View className="mb-4 rounded-xl border border-teal-100 bg-teal-50 p-3">
              <Text className="text-center text-sm font-semibold text-teal-800">
                Offline draft saved on this device
              </Text>
            </View>
          )}

          {/* Category Sections */}
          {evaluation.groupedDefinitions.map(([category, definitions]) => (
            <CompetencyCategorySection
              key={category}
              category={category}
              definitions={definitions}
              levels={evaluation.levels}
              remarks={evaluation.remarks}
              disabled={evaluation.isSubmitting || evaluation.isReadOnly}
              onLevelChange={evaluation.setLevel}
              onRemarksChange={evaluation.setRemark}
            />
          ))}

          {/* General Notes */}
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

          {/* Automatic Summary */}
          <CompetencySummaryCard summary={evaluation.summary} />

          {/* Action Buttons */}
          <CompetencyActionButtons
            isReadOnly={evaluation.isReadOnly}
            isSubmitting={evaluation.isSubmitting}
            isComplete={evaluation.progress.isComplete}
            isOffline={evaluation.isOffline}
            isQueueMode={isQueueMode}
            hasNextChild={Boolean(nextChildId)}
            onSaveDraft={() => void evaluation.saveDraft()}
            onSubmit={handleSubmitEvaluation}
          />
        </ScrollView>
      )}

      {/* History Bottom Sheet */}
      <CompetencyHistoryBottomSheet
        childId={childId}
        childName={child ? `${child.firstName} ${child.lastName}` : "Child"}
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
        onSelectEvaluation={evaluation.loadEvaluation}
      />
    </ScreenShell>
  );
}

import { Pressable, Text, View } from "react-native";

interface CompetencyFinalizedBannerProps {
  isFinalized: boolean;
  isEditing: boolean;
  isParentView: boolean;
  canEditFinalized: boolean;
  evaluationDateLabel: string;
  onStartEditing: () => void;
  onStartNewEvaluation: () => void;
  onCancelEditing: () => void;
}

export function CompetencyFinalizedBanner({
  isFinalized,
  isEditing,
  isParentView,
  canEditFinalized,
  evaluationDateLabel,
  onStartEditing,
  onStartNewEvaluation,
  onCancelEditing,
}: CompetencyFinalizedBannerProps) {
  if (!isFinalized) {
    return null;
  }

  const getDescription = () => {
    if (isEditing) {
      return "Updating record for this evaluation date. Changes will replace this submission.";
    }
    if (isParentView) {
      return "This is a read-only view of your child's competency evaluation.";
    }
    if (canEditFinalized) {
      return "Viewing completed record. You can edit this record or record a new evaluation for another date.";
    }
    return "Past evaluations are read-only. You can record a new evaluation for another date.";
  };

  return (
    <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-emerald-900">
          {isEditing
            ? "Editing Submitted Evaluation"
            : "Submitted Evaluation"}
        </Text>
        <View className="rounded-full bg-emerald-100 px-2.5 py-0.5">
          <Text className="text-xs font-semibold text-emerald-800">
            {evaluationDateLabel}
          </Text>
        </View>
      </View>
      <Text className="mt-1 text-sm text-emerald-800">
        {getDescription()}
      </Text>
      {!isParentView && !isEditing ? (
        <View className="mt-3 flex-row gap-2">
          {canEditFinalized ? (
            <Pressable
              onPress={onStartEditing}
              accessibilityRole="button"
              accessibilityLabel="Edit submitted evaluation"
              className="min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 active:bg-emerald-800"
            >
              <Text className="font-bold text-white">Edit Record</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onStartNewEvaluation}
            accessibilityRole="button"
            accessibilityLabel="Record new evaluation"
            className="min-h-11 flex-1 items-center justify-center rounded-xl bg-teal-600 px-4 active:bg-teal-700"
          >
            <Text className="font-bold text-white">+ New Evaluation</Text>
          </Pressable>
        </View>
      ) : null}
      {isEditing ? (
        <Pressable
          onPress={onCancelEditing}
          accessibilityRole="button"
          accessibilityLabel="Cancel editing evaluation"
          className="mt-3 min-h-10 items-center justify-center rounded-xl bg-emerald-100 px-4 active:bg-emerald-200"
        >
          <Text className="text-xs font-bold text-emerald-800">
            Cancel Editing
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}


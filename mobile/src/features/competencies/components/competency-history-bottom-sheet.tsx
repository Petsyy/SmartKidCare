import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { X, History, Calendar, AlertCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getCompetencyHistory } from "@/src/api/competency.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import type { CompetencyEvaluation } from "../types";

interface CompetencyHistoryBottomSheetProps {
  childId: string | null;
  childName: string;
  visible: boolean;
  onClose: () => void;
  onSelectEvaluation?: (evaluation: CompetencyEvaluation) => void;
}

export function CompetencyHistoryBottomSheet({
  childId,
  childName,
  visible,
  onClose,
  onSelectEvaluation,
}: CompetencyHistoryBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const {
    data: historyResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: mobileQueryKeys.competencyHistory(childId),
    enabled: Boolean(childId) && visible,
    queryFn: () => (childId ? getCompetencyHistory(childId) : null),
  });

  const evaluations = historyResponse?.data || [];
  const timelineEvaluations = [...evaluations].reverse();

  const getEvaluationTitle = (period: CompetencyEvaluation["period"]) =>
    period === "final" ? "Final Evaluation" : "Quarterly Evaluation";

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    });

  const getRatingSummary = (evaluation: CompetencyEvaluation) => {
    let achieved = 0;
    let developing = 0;
    let emerging = 0;
    let notDemonstrated = 0;

    for (const entry of evaluation.entries || []) {
      if (entry.level === "achieved") achieved++;
      else if (entry.level === "developing") developing++;
      else if (entry.level === "emerging") emerging++;
      else if (entry.level === "not_demonstrated") notDemonstrated++;
    }

    return { achieved, developing, emerging, notDemonstrated };
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
          accessibilityLabel="Close evaluation history"
        />

        <View
          className="rounded-t-3xl bg-gray-50 pt-5 shadow-lg"
          style={{
            maxHeight: "85%",
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          <View className="mb-5 flex-row items-center justify-between border-b border-gray-200/60 px-5 pb-3">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
              <History size={20} color="#0D9488" />
            </View>
            <View className="flex-1 pr-4">
              <Text className="text-lg font-black text-gray-900">
                Evaluation History
              </Text>
              <Text
                className="text-xs font-medium text-gray-500"
                numberOfLines={1}
              >
                {childName}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close evaluation history"
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
                  Loading evaluation history...
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
            ) : timelineEvaluations.length === 0 ? (
              <View className="items-center justify-center rounded-3xl border border-gray-100 bg-white py-10">
                <History size={32} color="#9CA3AF" />
                <Text className="mt-4 text-center text-base font-bold text-gray-900">
                  No records found
                </Text>
                <Text className="mt-1 text-center text-sm font-medium text-gray-500">
                  Competency evaluations will appear here.
                </Text>
              </View>
            ) : (
              <View className="ml-4 border-l-2 border-teal-200 py-2 pl-4">
                {timelineEvaluations.map((evaluation) => {
                  const summary = getRatingSummary(evaluation);
                  const dateLabel = evaluation.evaluationDate
                    ? formatDate(evaluation.evaluationDate)
                    : "Unknown Date";

                  return (
                    <View key={evaluation._id} className="relative mb-6">
                      <View className="absolute -left-[25px] top-4 h-4 w-4 rounded-full border-2 border-white bg-teal-500 shadow-sm" />

                      <Pressable
                        onPress={() => {
                          if (!onSelectEvaluation) return;
                          onSelectEvaluation(evaluation);
                          onClose();
                        }}
                        disabled={!onSelectEvaluation}
                        accessibilityRole={
                          onSelectEvaluation ? "button" : undefined
                        }
                        accessibilityLabel={
                          onSelectEvaluation
                            ? `View ${getEvaluationTitle(evaluation.period)} from ${dateLabel}`
                            : undefined
                        }
                        accessibilityState={{ disabled: !onSelectEvaluation }}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:opacity-90"
                      >
                        <View className="mb-3 flex-row items-center border-b border-gray-100 pb-2">
                          <Calendar size={16} color="#0D9488" />
                          <Text className="ml-2 flex-1 text-base font-bold text-gray-900">
                            {getEvaluationTitle(evaluation.period)}
                          </Text>
                        </View>

                        <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                          {dateLabel}
                        </Text>

                        <SummaryRow label="Achieved" value={summary.achieved} />
                        <SummaryRow
                          label="Developing"
                          value={summary.developing}
                        />
                        <SummaryRow label="Emerging" value={summary.emerging} />
                        <SummaryRow
                          label="Not Yet"
                          value={summary.notDemonstrated}
                          last
                        />

                        {evaluation.generalNotes ? (
                          <Text
                            className="mb-3 text-xs italic leading-4 text-gray-600"
                            numberOfLines={2}
                          >
                            &quot;{evaluation.generalNotes}&quot;
                          </Text>
                        ) : null}

                        <View className="flex-row items-center border-t border-gray-50 pt-2">
                          <Text className="flex-1 text-sm font-semibold text-gray-600">
                            Status
                          </Text>
                          <View className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1">
                            <Text className="text-xs font-extrabold text-emerald-700">
                              Submitted
                            </Text>
                          </View>
                        </View>

                        {onSelectEvaluation ? (
                          <Text className="mt-3 text-right text-xs font-bold text-teal-700">
                            View evaluation
                          </Text>
                        ) : null}
                      </Pressable>
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

interface SummaryRowProps {
  label: string;
  value: number;
  last?: boolean;
}

function SummaryRow({ label, value, last = false }: SummaryRowProps) {
  return (
    <View className={`flex-row ${last ? "mb-3" : "mb-2"}`}>
      <Text className="flex-1 text-sm font-semibold text-gray-600">
        {label}
      </Text>
      <Text className="flex-1 text-right text-sm font-extrabold text-gray-900">
        {value}
      </Text>
    </View>
  );
}

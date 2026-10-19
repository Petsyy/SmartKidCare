import React, { useMemo, useState } from "react";
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
  History,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Award,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getCompetencyHistory } from "@/src/api/competency.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import type {
  CompetencyEvaluation,
  CompetencyLevel,
} from "../types";

interface CompetencyHistoryBottomSheetProps {
  childId: string | null;
  childName: string;
  visible: boolean;
  onClose: () => void;
  onSelectEvaluation?: (evaluation: CompetencyEvaluation) => void;
}

const LEVEL_CONFIG: Record<
  CompetencyLevel,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  achieved: {
    label: "Achieved",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  developing: {
    label: "Developing",
    bgClass: "bg-teal-50",
    textClass: "text-teal-700",
    borderClass: "border-teal-200",
  },
  emerging: {
    label: "Emerging",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  not_demonstrated: {
    label: "Not Yet",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-200",
  },
};

export function CompetencyHistoryBottomSheet({
  childId,
  childName,
  visible,
  onClose,
  onSelectEvaluation,
}: CompetencyHistoryBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data: historyResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: mobileQueryKeys.competencyHistory(childId),
    enabled: Boolean(childId) && visible,
    queryFn: () => (childId ? getCompetencyHistory(childId) : null),
  });

  const timelineEvaluations = useMemo(() => {
    const list = historyResponse?.data || [];
    return [...list].reverse();
  }, [historyResponse?.data]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
                  const isExpanded = expandedId === evaluation._id;
                  const dateLabel = evaluation.evaluationDate
                    ? formatDate(evaluation.evaluationDate)
                    : "Unknown Date";

                  const totalSkills =
                    summary.achieved +
                    summary.developing +
                    summary.emerging +
                    summary.notDemonstrated;
                  const achievedPercent =
                    totalSkills > 0
                      ? Math.round((summary.achieved / totalSkills) * 100)
                      : 0;

                  // Group entries by category
                  const entriesByCategory: Record<
                    string,
                    CompetencyEvaluation["entries"]
                  > = {};
                  for (const entry of evaluation.entries || []) {
                    const cat = entry.competency?.category || "General";
                    if (!entriesByCategory[cat]) entriesByCategory[cat] = [];
                    entriesByCategory[cat].push(entry);
                  }

                  return (
                    <View key={evaluation._id} className="relative mb-5">
                      <View className="absolute -left-[25px] top-4 h-4 w-4 rounded-full border-2 border-white bg-teal-500 shadow-sm" />

                      <View className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* Header: Title, Date, and Status Badge */}
                        <Pressable
                          onPress={() => toggleExpand(evaluation._id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${getEvaluationTitle(evaluation.period)} details`}
                          className="active:opacity-85"
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="mr-2 flex-1 flex-row items-center">
                              <View className="mr-2.5 h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                                <Award size={18} color="#0D9488" />
                              </View>
                              <View className="flex-1">
                                <Text className="text-base font-extrabold text-gray-900">
                                  {getEvaluationTitle(evaluation.period)}
                                </Text>
                                <View className="mt-0.5 flex-row items-center">
                                  <Calendar size={12} color="#9CA3AF" />
                                  <Text className="ml-1 text-xs font-medium text-gray-500">
                                    {dateLabel}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                              <Text className="text-[11px] font-bold text-emerald-700">
                                Completed
                              </Text>
                            </View>
                          </View>
                        </Pressable>

                        {/* Simplified Mastery Progress */}
                        {totalSkills > 0 ? (
                          <View className="mt-3.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                            <View className="mb-2 flex-row items-center justify-between">
                              <Text className="text-xs font-bold text-gray-700">
                                Mastery Progress
                              </Text>
                              <Text className="text-xs font-black text-teal-700">
                                {summary.achieved} of {totalSkills} skills ({achievedPercent}%)
                              </Text>
                            </View>

                            {/* Split Visual Progress Bar */}
                            <View className="h-2.5 w-full flex-row overflow-hidden rounded-full bg-gray-200">
                              {summary.achieved > 0 ? (
                                <View
                                  style={{
                                    width: `${(summary.achieved / totalSkills) * 100}%`,
                                  }}
                                  className="h-full bg-emerald-500"
                                />
                              ) : null}
                              {summary.developing > 0 ? (
                                <View
                                  style={{
                                    width: `${(summary.developing / totalSkills) * 100}%`,
                                  }}
                                  className="h-full bg-teal-400"
                                />
                              ) : null}
                              {summary.emerging > 0 ? (
                                <View
                                  style={{
                                    width: `${(summary.emerging / totalSkills) * 100}%`,
                                  }}
                                  className="h-full bg-amber-400"
                                />
                              ) : null}
                              {summary.notDemonstrated > 0 ? (
                                <View
                                  style={{
                                    width: `${(summary.notDemonstrated / totalSkills) * 100}%`,
                                  }}
                                  className="h-full bg-rose-400"
                                />
                              ) : null}
                            </View>

                            {/* Friendly Stats Legend */}
                            <View className="mt-2.5 flex-row flex-wrap items-center gap-x-3 gap-y-1">
                              <View className="flex-row items-center">
                                <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                                <Text className="text-[11px] font-semibold text-gray-600">
                                  Achieved:{" "}
                                  <Text className="font-bold text-gray-900">
                                    {summary.achieved}
                                  </Text>
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <View className="mr-1.5 h-2 w-2 rounded-full bg-teal-400" />
                                <Text className="text-[11px] font-semibold text-gray-600">
                                  Developing:{" "}
                                  <Text className="font-bold text-gray-900">
                                    {summary.developing}
                                  </Text>
                                </Text>
                              </View>
                              {summary.emerging > 0 ? (
                                <View className="flex-row items-center">
                                  <View className="mr-1.5 h-2 w-2 rounded-full bg-amber-400" />
                                  <Text className="text-[11px] font-semibold text-gray-600">
                                    Emerging:{" "}
                                    <Text className="font-bold text-gray-900">
                                      {summary.emerging}
                                    </Text>
                                  </Text>
                                </View>
                              ) : null}
                              {summary.notDemonstrated > 0 ? (
                                <View className="flex-row items-center">
                                  <View className="mr-1.5 h-2 w-2 rounded-full bg-rose-400" />
                                  <Text className="text-[11px] font-semibold text-gray-600">
                                    Not Yet:{" "}
                                    <Text className="font-bold text-gray-900">
                                      {summary.notDemonstrated}
                                    </Text>
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        ) : null}

                        {/* Teacher's Observation Box */}
                        {evaluation.generalNotes ? (
                          <View className="mt-3 rounded-xl border border-teal-100/80 bg-teal-50/50 p-3">
                            <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                              Teacher Observation
                            </Text>
                            <Text className="mt-1 text-xs italic leading-5 text-teal-950">
                              &ldquo;{evaluation.generalNotes}&rdquo;
                            </Text>
                            {evaluation.teacher ? (
                              <Text className="mt-1 text-[11px] font-semibold text-teal-700">
                                — Teacher {evaluation.teacher.firstName}{" "}
                                {evaluation.teacher.lastName}
                              </Text>
                            ) : null}
                          </View>
                        ) : evaluation.teacher ? (
                          <View className="mt-2.5 flex-row items-center">
                            <UserCheck size={13} color="#6B7280" />
                            <Text className="ml-1.5 text-xs text-gray-500">
                              Evaluated by Teacher {evaluation.teacher.firstName}{" "}
                              {evaluation.teacher.lastName}
                            </Text>
                          </View>
                        ) : null}

                        {/* Expanded Checklist Details */}
                        {isExpanded ? (
                          <View className="mt-3 border-t border-gray-100 pt-3">
                            <Text className="mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                              Skill Checklist
                            </Text>

                            {Object.entries(entriesByCategory).map(
                              ([category, entries]) => (
                                <View key={category} className="mb-3">
                                  <Text className="mb-1 text-xs font-bold text-gray-700">
                                    {category}
                                  </Text>
                                  <View className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                                    {entries.map((entry, idx) => {
                                      const config =
                                        LEVEL_CONFIG[entry.level] ||
                                        LEVEL_CONFIG.not_demonstrated;
                                      const entryKey =
                                        entry.competency?._id ||
                                        entry.competency?.code ||
                                        `${evaluation._id}-${category}-${idx}`;

                                      return (
                                        <View
                                          key={entryKey}
                                          className={`py-2 ${
                                            idx < entries.length - 1
                                              ? "border-b border-gray-200/50"
                                              : ""
                                          }`}
                                        >
                                          <View className="flex-row items-center justify-between">
                                            <Text
                                              className="flex-1 pr-2 text-xs font-semibold text-gray-800"
                                              numberOfLines={2}
                                            >
                                              {entry.competency?.name ||
                                                entry.competency?.code ||
                                                "Skill"}
                                            </Text>
                                            <View
                                              className={`rounded-md border px-2 py-0.5 ${config.bgClass} ${config.borderClass}`}
                                            >
                                              <Text
                                                className={`text-[10px] font-extrabold ${config.textClass}`}
                                              >
                                                {config.label}
                                              </Text>
                                            </View>
                                          </View>
                                          {entry.remarks ? (
                                            <Text className="mt-1 text-[11px] italic text-gray-500">
                                              Note: {entry.remarks}
                                            </Text>
                                          ) : null}
                                        </View>
                                      );
                                    })}
                                  </View>
                                </View>
                              ),
                            )}
                          </View>
                        ) : null}

                        {/* Bottom Actions: View All Skills & optional Open Editor */}
                        <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-2.5">
                          <Pressable
                            onPress={() => toggleExpand(evaluation._id)}
                            accessibilityRole="button"
                            accessibilityLabel={
                              isExpanded ? "Hide skill details" : "View skill details"
                            }
                            className="flex-row items-center py-1 active:opacity-75"
                          >
                            <Text className="mr-1 text-xs font-bold text-teal-700">
                              {isExpanded ? "Hide Skill Details" : "View All Skills"}
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={15} color="#0F766E" />
                            ) : (
                              <ChevronDown size={15} color="#0F766E" />
                            )}
                          </Pressable>

                          {onSelectEvaluation ? (
                            <Pressable
                              onPress={() => {
                                onSelectEvaluation(evaluation);
                                onClose();
                              }}
                              accessibilityRole="button"
                              accessibilityLabel="Open evaluation in editor"
                              className="rounded-lg bg-teal-600 px-3 py-1.5 active:bg-teal-700"
                            >
                              <Text className="text-xs font-bold text-white">
                                Open in Editor
                              </Text>
                            </Pressable>
                          ) : null}
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

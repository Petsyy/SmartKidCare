import { useMemo, useState } from "react";
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
  AlertCircle,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getCompetencyHistory } from "@/src/api/competency.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import type { CompetencyEvaluation } from "../types";
import { CompetencyHistoryItem } from "./competency-history-item";

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

  const handleSelectEvaluation = (evaluation: CompetencyEvaluation) => {
    if (onSelectEvaluation) {
      onSelectEvaluation(evaluation);
      onClose();
    }
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
                {timelineEvaluations.map((evaluation) => (
                  <CompetencyHistoryItem
                    key={evaluation._id}
                    evaluation={evaluation}
                    isExpanded={expandedId === evaluation._id}
                    onToggleExpand={() => toggleExpand(evaluation._id)}
                    onSelectEvaluation={
                      onSelectEvaluation ? handleSelectEvaluation : undefined
                    }
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

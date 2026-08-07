import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompetencyDefinitions,
  getCompetencyEvaluationByPeriod,
  submitCompetencyEvaluation,
} from "../../../api/competency.api";
import { getChildById } from "../../../api/parent.api";
import { mobileQueryKeys } from "../../../lib/query-keys";
import { getManilaDateKey } from "../../../utils/manila-date";
import type { CompetencyDefinition, CompetencyLevel } from "../types";

export type EvaluationPeriod = "initial" | "midyear" | "final";

export function useCompetencyEvaluation(childId: string | null) {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<EvaluationPeriod>("initial");
  const [levels, setLevels] = useState<Record<string, CompetencyLevel>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const query = useQuery({
    queryKey: ["competencyScreen", childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      if (!childId) throw new Error("Missing child ID.");
      const [child, definitions, initial, midyear, final] = await Promise.all([
        getChildById(childId),
        getCompetencyDefinitions(),
        getCompetencyEvaluationByPeriod(childId, "initial"),
        getCompetencyEvaluationByPeriod(childId, "midyear"),
        getCompetencyEvaluationByPeriod(childId, "final"),
      ]);
      return {
        child,
        definitions,
        evaluations: { initial, midyear, final },
      };
    },
  });

  const selectedEvaluation = query.data?.evaluations[selectedPeriod] ?? null;

  // Sync state when evaluation loads or period changes
  useEffect(() => {
    if (selectedEvaluation) {
      const newLevels: Record<string, CompetencyLevel> = {};
      const newRemarks: Record<string, string> = {};
      for (const entry of selectedEvaluation.entries) {
        newLevels[entry.competency._id] = entry.level;
        if (entry.remarks) newRemarks[entry.competency._id] = entry.remarks;
      }
      setLevels(newLevels);
      setRemarks(newRemarks);
      setGeneralNotes(selectedEvaluation.generalNotes || "");
      setSavedSnapshot(createSnapshot(newLevels, newRemarks, selectedEvaluation.generalNotes || ""));
    } else if (query.data) {
      setLevels({});
      setRemarks({});
      setGeneralNotes("");
      setSavedSnapshot(createSnapshot({}, {}, ""));
    }
  }, [query.data, selectedEvaluation, selectedPeriod]);

  const groupedDefinitions = useMemo(() => {
    const groups = new Map<string, CompetencyDefinition[]>();
    for (const definition of query.data?.definitions || []) {
      groups.set(definition.category, [...(groups.get(definition.category) || []), definition]);
    }
    return Array.from(groups.entries());
  }, [query.data?.definitions]);

  const progress = useMemo(() => {
    const total = query.data?.definitions.length || 0;
    const completed = Object.keys(levels).length;
    return { total, completed, isComplete: total > 0 && completed === total };
  }, [levels, query.data?.definitions]);

  const summary = useMemo(() => {
    const counts = { not_demonstrated: 0, emerging: 0, developing: 0, achieved: 0 };
    for (const level of Object.values(levels)) {
      counts[level]++;
    }
    return counts;
  }, [levels]);

  const periodStates = useMemo(() => {
    const initialSubmitted = query.data?.evaluations.initial?.status === "submitted";
    const midyearSubmitted = query.data?.evaluations.midyear?.status === "submitted";

    return {
      initial: {
        isLocked: false,
        isSubmitted: initialSubmitted,
        prerequisiteLabel: null,
      },
      midyear: {
        isLocked: !initialSubmitted,
        isSubmitted: midyearSubmitted,
        prerequisiteLabel: "Initial",
      },
      final: {
        isLocked: !midyearSubmitted,
        isSubmitted: query.data?.evaluations.final?.status === "submitted",
        prerequisiteLabel: "Mid-Year",
      },
    } satisfies Record<EvaluationPeriod, {
      isLocked: boolean;
      isSubmitted: boolean;
      prerequisiteLabel: string | null;
    }>;
  }, [query.data?.evaluations]);

  const selectedPeriodState = periodStates[selectedPeriod];
  const isReadOnly = selectedEvaluation?.status === "submitted";
  const hasUnsavedChanges = Boolean(
    query.data &&
    !isReadOnly &&
    createSnapshot(levels, remarks, generalNotes) !== savedSnapshot,
  );

  const mutation = useMutation({
    mutationFn: (status: "draft" | "submitted") => {
      if (!childId || !query.data) throw new Error("Child information is unavailable.");
      
      const entries = Object.keys(levels).map((id) => ({
        competencyId: id,
        level: levels[id],
        remarks: remarks[id]?.trim() || undefined,
      }));

      if (status === "submitted") {
        if (!progress.isComplete) throw new Error("All competencies must be evaluated before submitting.");
        
        for (const entry of entries) {
          if ((entry.level === "not_demonstrated" || entry.level === "emerging") && !entry.remarks) {
            const def = query.data.definitions.find((d) => d._id === entry.competencyId);
            throw new Error(`Remarks are required for "${def?.name}" because the rating is Not Yet or Emerging.`);
          }
        }
      }

      return submitCompetencyEvaluation({
        childId,
        evaluationDate: getManilaDateKey(),
        period: selectedPeriod,
        status,
        entries,
        generalNotes: generalNotes.trim() || undefined,
      });
    },
    onSuccess: async (data, status) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["competencyScreen", childId] }),
        queryClient.invalidateQueries({ queryKey: mobileQueryKeys.competencyHistory(childId) }),
      ]);
      Alert.alert(status === "draft" ? "Draft Saved" : "Evaluation Submitted", data.message);
    },
    onError: (error: Error) => Alert.alert("Unable to Save", error.message),
  });

  const handlePeriodChange = (newPeriod: EvaluationPeriod) => {
    if (newPeriod === selectedPeriod) return;

    const nextPeriodState = periodStates[newPeriod];
    if (nextPeriodState.isLocked) {
      Alert.alert(
        `${newPeriod === "midyear" ? "Mid-Year" : "Final"} Evaluation Locked`,
        `Submit the ${nextPeriodState.prerequisiteLabel} evaluation first to unlock this period.`,
        [{ text: "Got It" }],
      );
      return;
    }

    if (hasUnsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Switch periods anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Switch", style: "destructive", onPress: () => setSelectedPeriod(newPeriod) }
        ]
      );
    } else {
      setSelectedPeriod(newPeriod);
    }
  };

  return {
    ...query,
    groupedDefinitions,
    selectedPeriod,
    selectedPeriodState,
    periodStates,
    handlePeriodChange,
    levels,
    remarks,
    generalNotes,
    progress,
    summary,
    isReadOnly,
    hasUnsavedChanges,
    setLevel: (id: string, level: CompetencyLevel) => {
      if (isReadOnly) return;
      setLevels((current) => ({ ...current, [id]: level }));
    },
    setRemark: (id: string, value: string) => {
      if (isReadOnly) return;
      setRemarks((current) => ({ ...current, [id]: value }));
    },
    setGeneralNotes: (val: string) => {
      if (isReadOnly) return;
      setGeneralNotes(val);
    },
    saveDraft: () => mutation.mutateAsync("draft"),
    submitEvaluation: () => mutation.mutate("submitted"),
    isSubmitting: mutation.isPending,
  };
}

function createSnapshot(
  levels: Record<string, CompetencyLevel>,
  remarks: Record<string, string>,
  generalNotes: string,
) {
  const entries = Object.keys(levels)
    .sort()
    .map((id) => [id, levels[id], remarks[id]?.trim() || ""]);

  return JSON.stringify({ entries, generalNotes: generalNotes.trim() });
}





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
import {
  formatManilaDateLabel,
  getManilaDateKey,
  toManilaDateKey,
} from "../../../utils/manila-date";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import {
  deleteScopedDraft,
  getScopedDraft,
  saveScopedDraft,
} from "@/src/offline/offline-store";
import type { CompetencyDraftPayload } from "@/src/offline/offline.types";
import type { CompetencyDefinition, CompetencyLevel } from "../types";

export type EvaluationPeriod = "quarterly" | "final";

const competencyDraftScopeKey = (childId: string, period: EvaluationPeriod) =>
  `${childId}:${period}`;

export function useCompetencyEvaluation(
  childId: string | null,
  options: { isParentView?: boolean } = {},
) {
  const { user } = useAuth();
  const { isConnected, isInternetReachable, refreshPendingCount } =
    useOffline();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] =
    useState<EvaluationPeriod>("quarterly");
  const [levels, setLevels] = useState<Record<string, CompetencyLevel>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [evaluationDate, setEvaluationDate] = useState(() =>
    getManilaDateKey(),
  );
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const isOffline = !isConnected || !isInternetReachable;

  const query = useQuery({
    queryKey: ["competencyScreen", childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      if (!childId) throw new Error("Missing child ID.");
      const [child, definitions, quarterly, final] = await Promise.all([
        getChildById(childId),
        getCompetencyDefinitions(),
        getCompetencyEvaluationByPeriod(childId, "quarterly"),
        getCompetencyEvaluationByPeriod(childId, "final"),
      ]);
      return {
        child,
        definitions,
        evaluations: { quarterly, final },
      };
    },
  });

  const selectedEvaluation = query.data?.evaluations[selectedPeriod] ?? null;

  // Sync state when evaluation loads or period changes
  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    void (async () => {
      const localDraft = user?.id
        ? await getScopedDraft(
            user.id,
            "competency",
            competencyDraftScopeKey(childId, selectedPeriod),
          )
        : null;
      if (cancelled) return;

      if (localDraft) {
        const payload = localDraft.payload as CompetencyDraftPayload;
        setLevels(payload.levels);
        setRemarks(payload.remarks);
        setGeneralNotes(payload.generalNotes || "");
        setEvaluationDate(payload.evaluationDate);
        setSavedSnapshot(
          createSnapshot(
            payload.levels,
            payload.remarks,
            payload.generalNotes || "",
            payload.evaluationDate,
          ),
        );
        setHasLocalDraft(true);
        return;
      }

      setHasLocalDraft(false);

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
        const savedEvaluationDate =
          toManilaDateKey(selectedEvaluation.evaluationDate) ||
          getManilaDateKey();
        setEvaluationDate(savedEvaluationDate);
        setSavedSnapshot(
          createSnapshot(
            newLevels,
            newRemarks,
            selectedEvaluation.generalNotes || "",
            savedEvaluationDate,
          ),
        );
      } else if (query.data) {
        const today = getManilaDateKey();
        setLevels({});
        setRemarks({});
        setGeneralNotes("");
        setEvaluationDate(today);
        setSavedSnapshot(createSnapshot({}, {}, "", today));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [childId, query.data, selectedEvaluation, selectedPeriod, user?.id]);

  const groupedDefinitions = useMemo(() => {
    const groups = new Map<string, CompetencyDefinition[]>();
    for (const definition of query.data?.definitions || []) {
      groups.set(definition.category, [
        ...(groups.get(definition.category) || []),
        definition,
      ]);
    }
    return Array.from(groups.entries());
  }, [query.data?.definitions]);

  const progress = useMemo(() => {
    const total = query.data?.definitions.length || 0;
    const completed = Object.keys(levels).length;
    return { total, completed, isComplete: total > 0 && completed === total };
  }, [levels, query.data?.definitions]);

  const summary = useMemo(() => {
    const counts = {
      not_demonstrated: 0,
      emerging: 0,
      developing: 0,
      achieved: 0,
    };
    for (const level of Object.values(levels)) {
      counts[level]++;
    }
    return counts;
  }, [levels]);

  const periodStates = useMemo(() => {
    const quarterlySubmitted =
      query.data?.evaluations.quarterly?.status === "submitted";

    return {
      quarterly: {
        isLocked: false,
        isSubmitted: quarterlySubmitted,
        prerequisiteLabel: null,
      },
      final: {
        isLocked: !quarterlySubmitted,
        isSubmitted: query.data?.evaluations.final?.status === "submitted",
        prerequisiteLabel: "Quarterly",
      },
    } satisfies Record<
      EvaluationPeriod,
      {
        isLocked: boolean;
        isSubmitted: boolean;
        prerequisiteLabel: string | null;
      }
    >;
  }, [query.data?.evaluations]);

  const selectedPeriodState = periodStates[selectedPeriod];
  const isReadOnly =
    options.isParentView || selectedEvaluation?.status === "submitted";
  const hasUnsavedChanges = Boolean(
    query.data &&
    !isReadOnly &&
    createSnapshot(levels, remarks, generalNotes, evaluationDate) !==
      savedSnapshot,
  );

  useEffect(() => {
    if (!user?.id || !childId || isReadOnly || !query.data) return;
    const currentSnapshot = createSnapshot(
      levels,
      remarks,
      generalNotes,
      evaluationDate,
    );
    if (currentSnapshot === savedSnapshot) return;

    const timeout = setTimeout(() => {
      const payload: CompetencyDraftPayload = {
        childId,
        period: selectedPeriod,
        evaluationDate,
        levels,
        remarks,
        generalNotes,
      };
      void saveScopedDraft({
        userId: user.id,
        recordType: "competency",
        dateKey: selectedPeriod,
        draftScopeKey: competencyDraftScopeKey(childId, selectedPeriod),
        payload,
      }).then(async () => {
        setHasLocalDraft(true);
        await refreshPendingCount();
      });
    }, 600);
    return () => clearTimeout(timeout);
  }, [
    childId,
    evaluationDate,
    generalNotes,
    isReadOnly,
    levels,
    query.data,
    refreshPendingCount,
    remarks,
    savedSnapshot,
    selectedPeriod,
    user?.id,
  ]);

  const mutation = useMutation({
    mutationFn: (status: "draft" | "submitted") => {
      if (!childId || !query.data)
        throw new Error("Child information is unavailable.");

      const entries = Object.keys(levels).map((id) => ({
        competencyId: id,
        level: levels[id],
        remarks: remarks[id]?.trim() || undefined,
      }));

      if (status === "submitted") {
        if (!progress.isComplete)
          throw new Error(
            "All competencies must be evaluated before submitting.",
          );

        for (const entry of entries) {
          if (
            (entry.level === "not_demonstrated" ||
              entry.level === "emerging") &&
            !entry.remarks
          ) {
            const def = query.data.definitions.find(
              (d) => d._id === entry.competencyId,
            );
            throw new Error(
              `Remarks are required for "${def?.name}" because the rating is Not Yet or Emerging.`,
            );
          }
        }
      }

      return submitCompetencyEvaluation({
        childId,
        evaluationDate,
        period: selectedPeriod,
        status,
        entries,
        generalNotes: generalNotes.trim() || undefined,
      });
    },
    onSuccess: async (data, status) => {
      if (status === "submitted" && childId && user?.id) {
        await deleteScopedDraft(
          user.id,
          "competency",
          competencyDraftScopeKey(childId, selectedPeriod),
        );
        setHasLocalDraft(false);
        await refreshPendingCount();
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["competencyScreen", childId],
        }),
        queryClient.invalidateQueries({
          queryKey: mobileQueryKeys.competencyHistory(childId),
        }),
      ]);
      Alert.alert(
        status === "draft"
          ? "Draft saved on this device"
          : "Evaluation Submitted",
        status === "draft"
          ? "You can return to this draft later on this device."
          : data.message,
      );
    },
    onError: (error: Error) => Alert.alert("Unable to Save", error.message),
  });

  const saveLocalDraft = async () => {
    if (!user?.id || !childId) {
      throw new Error("Child information is unavailable.");
    }
    const payload: CompetencyDraftPayload = {
      childId,
      period: selectedPeriod,
      evaluationDate,
      levels,
      remarks,
      generalNotes,
    };
    await saveScopedDraft({
      userId: user.id,
      recordType: "competency",
      dateKey: selectedPeriod,
      draftScopeKey: competencyDraftScopeKey(childId, selectedPeriod),
      payload,
    });
    setHasLocalDraft(true);
    await refreshPendingCount();
  };

  const handlePeriodChange = (newPeriod: EvaluationPeriod) => {
    if (newPeriod === selectedPeriod) return;

    const nextPeriodState = periodStates[newPeriod];
    if (nextPeriodState.isLocked) {
      Alert.alert(
        "Final Evaluation Locked",
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
          {
            text: "Switch",
            style: "destructive",
            onPress: () => setSelectedPeriod(newPeriod),
          },
        ],
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
    evaluationDate,
    evaluationDateLabel: formatManilaDateLabel(evaluationDate),
    periodStates,
    handlePeriodChange,
    levels,
    remarks,
    generalNotes,
    progress,
    summary,
    isReadOnly,
    hasUnsavedChanges,
    hasLocalDraft,
    isOffline,
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
    setEvaluationDate: (value: string) => {
      if (isReadOnly) return;
      setEvaluationDate(value);
    },
    saveDraft: async () => {
      try {
        await saveLocalDraft();
        if (isOffline) {
          Alert.alert(
            "Draft saved on this device",
            "You can return to this draft later on this device.",
          );
          return;
        }
        await mutation.mutateAsync("draft").catch(() => undefined);
      } catch (error) {
        Alert.alert(
          "Unable to Save",
          error instanceof Error ? error.message : "Failed to save draft.",
        );
      }
    },
    submitEvaluation: async () => {
      if (isOffline) {
        Alert.alert(
          "Internet Required",
          "Connect to the internet to submit this evaluation.",
        );
        return;
      }
      try {
        await saveLocalDraft();
        await mutation.mutateAsync("submitted").catch(() => undefined);
      } catch (error) {
        Alert.alert(
          "Unable to Save",
          error instanceof Error
            ? error.message
            : "Failed to submit evaluation.",
        );
      }
    },
    isSubmitting: mutation.isPending,
  };
}

function createSnapshot(
  levels: Record<string, CompetencyLevel>,
  remarks: Record<string, string>,
  generalNotes: string,
  evaluationDate: string,
) {
  const entries = Object.keys(levels)
    .sort()
    .map((id) => [id, levels[id], remarks[id]?.trim() || ""]);

  return JSON.stringify({
    entries,
    generalNotes: generalNotes.trim(),
    evaluationDate,
  });
}

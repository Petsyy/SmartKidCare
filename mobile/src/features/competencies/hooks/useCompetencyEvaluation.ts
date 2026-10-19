import { useEffect, useMemo, useRef, useState } from "react";
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
import type {
  CompetencyDefinition,
  CompetencyEvaluation,
  CompetencyLevel,
} from "../types";
import {
  onlineWithOfflineFallback,
  readOfflineResource,
} from "@/src/offline/offline-read";
import type { Child } from "@/src/api/parent.api";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";

type OfflineCompetencyEvaluation = Omit<CompetencyEvaluation, "entries"> & {
  child: string;
  entries: {
    competency: string | CompetencyDefinition;
    level: CompetencyLevel;
    remarks?: string;
  }[];
};

export type EvaluationPeriod = "quarterly" | "final";

const competencyDraftScopeKey = (
  childId: string,
  period: EvaluationPeriod,
  date: string,
) => `${childId}:${period}:${date}`;

export function useCompetencyEvaluation(
  childId: string | null,
  options: {
    isParentView?: boolean;
    initialPeriod?: EvaluationPeriod;
    initialDate?: string;
  } = {},
) {
  const { user } = useAuth();
  const { isConnected, isInternetReachable, refreshPendingCount } =
    useOffline();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [loadedEvaluationId, setLoadedEvaluationId] = useState<string | null>(
    null,
  );
  const [loadedEvaluationStatus, setLoadedEvaluationStatus] = useState<
    CompetencyEvaluation["status"] | null
  >(null);
  const [isDateLookupPending, setIsDateLookupPending] = useState(false);
  const dateLookupSequence = useRef(0);
  const [selectedPeriod, setSelectedPeriod] = useState<EvaluationPeriod>(
    options.initialPeriod || "quarterly",
  );
  const [levels, setLevels] = useState<Record<string, CompetencyLevel>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [evaluationDate, setEvaluationDate] = useState(
    () => options.initialDate || getManilaDateKey(),
  );
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const isOffline = !isConnected || !isInternetReachable;

  const query = useQuery({
    queryKey: ["competencyScreen", childId],
    networkMode: "always",
    enabled: Boolean(childId),
    queryFn: async () => {
      if (!childId) throw new Error("Missing child ID.");
      if (!user?.id) throw new Error("Please sign in again.");
      const localRead = async () => {
        const [children, definitions, evaluations] = await Promise.all([
          readOfflineResource<Child>(user.id, "children"),
          readOfflineResource<CompetencyDefinition>(
            user.id,
            "competencyDefinitions",
          ),
          readOfflineResource<OfflineCompetencyEvaluation>(
            user.id,
            "competencyEvaluations",
          ),
        ]);
        const child = children.find((entry) => entry._id === childId);
        if (!child) throw new Error("This child is unavailable offline.");
        const definitionMap = new Map(
          definitions.map((definition) => [definition._id, definition]),
        );
        const normalize = (
          evaluation: OfflineCompetencyEvaluation | undefined,
        ): CompetencyEvaluation | null =>
          evaluation
            ? {
                ...evaluation,
                entries: evaluation.entries.map((entry) => ({
                  ...entry,
                  competency:
                    typeof entry.competency === "string"
                      ? (definitionMap.get(entry.competency) ?? {
                          _id: entry.competency,
                          name: "Competency",
                          category: "Fine Motor",
                          description: "",
                          displayOrder: 0,
                          code: "",
                        })
                      : entry.competency,
                })),
              }
            : null;
        return {
          child,
          definitions,
          evaluations: {
            quarterly: normalize(
              evaluations.find(
                (entry) =>
                  entry.child === childId && entry.period === "quarterly",
              ),
            ),
            final: normalize(
              evaluations.find(
                (entry) => entry.child === childId && entry.period === "final",
              ),
            ),
          },
        };
      };
      return onlineWithOfflineFallback(
        isOffline,
        async () => {
          const [child, definitions, quarterly, final] = await Promise.all([
            getChildById(childId),
            getCompetencyDefinitions(),
            getCompetencyEvaluationByPeriod(
              childId,
              "quarterly",
              options.initialPeriod === "quarterly"
                ? options.initialDate
                : undefined,
            ),
            getCompetencyEvaluationByPeriod(
              childId,
              "final",
              options.initialPeriod === "final"
                ? options.initialDate
                : undefined,
            ),
          ]);
          return { child, definitions, evaluations: { quarterly, final } };
        },
        localRead,
      );
    },
  });

  const selectedEvaluation = query.data?.evaluations[selectedPeriod] ?? null;

  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Sync state when evaluation loads or period changes
  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    void (async () => {
      // If user is actively creating a new evaluation, don't overwrite with existing record
      if (isCreatingNew) return;

      let localDraft = user?.id
        ? await getScopedDraft(
            user.id,
            "competency",
            competencyDraftScopeKey(childId, selectedPeriod, evaluationDate),
          )
        : null;
      if (!localDraft && user?.id) {
        const legacyDraft = await getScopedDraft(
          user.id,
          "competency",
          `${childId}:${selectedPeriod}`,
        );
        const legacyPayload = legacyDraft?.payload as
          CompetencyDraftPayload | undefined;
        if (
          legacyPayload &&
          (!options.initialDate ||
            legacyPayload.evaluationDate === options.initialDate)
        ) {
          localDraft = legacyDraft;
        }
      }
      if (cancelled) return;

      const draftPayload = localDraft
        ? (localDraft.payload as CompetencyDraftPayload)
        : null;
      if (
        draftPayload &&
        (!selectedEvaluation ||
          Object.keys(draftPayload.levels || {}).length > 0)
      ) {
        setLevels(draftPayload.levels || {});
        setRemarks(draftPayload.remarks || {});
        setGeneralNotes(draftPayload.generalNotes || "");
        setEvaluationDate(draftPayload.evaluationDate || getManilaDateKey());
        setLoadedEvaluationId(draftPayload.evaluationId || null);
        setLoadedEvaluationStatus(null);
        setSavedSnapshot(
          createSnapshot(
            draftPayload.levels || {},
            draftPayload.remarks || {},
            draftPayload.generalNotes || "",
            draftPayload.evaluationDate || getManilaDateKey(),
          ),
        );
        setHasLocalDraft(true);
        return;
      }

      setHasLocalDraft(false);

      if (selectedEvaluation) {
        setLoadedEvaluationId(selectedEvaluation._id);
        setLoadedEvaluationStatus(selectedEvaluation.status);
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
        setLoadedEvaluationId(null);
        setLoadedEvaluationStatus(null);
        const today = options.initialDate || getManilaDateKey();
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
  }, [
    childId,
    evaluationDate,
    query.data,
    selectedEvaluation,
    selectedPeriod,
    user?.id,
    isCreatingNew,
    options.initialDate,
  ]);

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
  const isFinalized = Boolean(
    !isCreatingNew &&
    loadedEvaluationId &&
    loadedEvaluationStatus === "submitted",
  );
  const isReadOnly = options.isParentView || (isFinalized && !isEditing);
  const canEditFinalized = Boolean(
    !options.isParentView &&
    isFinalized &&
    evaluationDate === getManilaDateKey(),
  );
  const hasUnsavedChanges = Boolean(
    query.data &&
    !isReadOnly &&
    createSnapshot(levels, remarks, generalNotes, evaluationDate) !==
      savedSnapshot,
  );

  useEffect(() => {
    if (
      !user?.id ||
      !childId ||
      isReadOnly ||
      isDateLookupPending ||
      !query.data
    )
      return;
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
        evaluationId: loadedEvaluationId ?? undefined,
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
        draftScopeKey: competencyDraftScopeKey(
          childId,
          selectedPeriod,
          evaluationDate,
        ),
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
    isDateLookupPending,
    levels,
    loadedEvaluationId,
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
        evaluationId: isEditing ? (loadedEvaluationId ?? undefined) : undefined,
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
          competencyDraftScopeKey(childId, selectedPeriod, evaluationDate),
        );
        await deleteScopedDraft(
          user.id,
          "competency",
          `${childId}:${selectedPeriod}`,
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
        queryClient.invalidateQueries({
          queryKey: mobileQueryKeys.competencyClassStatus(
            selectedPeriod,
            evaluationDate,
          ),
        }),
      ]);
      setLoadedEvaluationId(data.evaluation._id);
      setLoadedEvaluationStatus(data.evaluation.status);
      setIsCreatingNew(false);
      setIsEditing(false);
      Alert.alert(
        status === "draft"
          ? "Draft saved on this device"
          : "Evaluation Submitted",
        status === "draft"
          ? "You can return to this draft later on this device."
          : data.notification?.status === "push_failed"
            ? `${data.message} The in-app parent alert was saved, but push delivery failed.`
            : data.message,
      );
    },
    onError: (error: unknown) => {
      reportHandledError("competency.evaluation.save", error);
      Alert.alert(
        "Unable to Save",
        getUserFriendlyErrorMessage(
          error,
          "The evaluation could not be saved. Please try again.",
        ),
      );
    },
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
      draftScopeKey: competencyDraftScopeKey(
        childId,
        selectedPeriod,
        evaluationDate,
      ),
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
      setIsEditing(false);
      setSelectedPeriod(newPeriod);
    }
  };

  const loadEvaluationIntoForm = (evaluation: CompetencyEvaluation) => {
    setIsCreatingNew(false);
    setLoadedEvaluationId(evaluation._id);
    setLoadedEvaluationStatus(evaluation.status);
    setSelectedPeriod(evaluation.period);
    const newLevels: Record<string, CompetencyLevel> = {};
    const newRemarks: Record<string, string> = {};
    for (const entry of evaluation.entries || []) {
      newLevels[entry.competency._id] = entry.level;
      if (entry.remarks) newRemarks[entry.competency._id] = entry.remarks;
    }
    setLevels(newLevels);
    setRemarks(newRemarks);
    setGeneralNotes(evaluation.generalNotes || "");
    const savedDate =
      toManilaDateKey(evaluation.evaluationDate) || getManilaDateKey();
    setEvaluationDate(savedDate);
    setIsEditing(false);
    setSavedSnapshot(
      createSnapshot(
        newLevels,
        newRemarks,
        evaluation.generalNotes || "",
        savedDate,
      ),
    );
  };

  const handleEvaluationDateChange = async (value: string) => {
    if (isReadOnly) return;
    setEvaluationDate(value);
    if (!childId || isOffline) return;

    const lookupSequence = ++dateLookupSequence.current;
    setIsDateLookupPending(true);
    try {
      const existingEvaluation = await getCompetencyEvaluationByPeriod(
        childId,
        selectedPeriod,
        value,
      );
      if (lookupSequence !== dateLookupSequence.current) return;
      if (existingEvaluation) loadEvaluationIntoForm(existingEvaluation);
    } catch (error) {
      if (lookupSequence !== dateLookupSequence.current) return;
      reportHandledError("competency.evaluation.date_lookup", error);
      Alert.alert(
        "Unable to Load Evaluation",
        getUserFriendlyErrorMessage(
          error,
          "The evaluation for this date could not be loaded. Please try again.",
        ),
      );
    } finally {
      if (lookupSequence === dateLookupSequence.current) {
        setIsDateLookupPending(false);
      }
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
    isFinalized,
    isEditing,
    loadedEvaluationId,
    canEditFinalized,
    isCreatingNew,
    startEditing: () => {
      if (!canEditFinalized) return;
      setIsCreatingNew(false);
      setIsEditing(true);
    },
    cancelEditing: () => {
      setIsEditing(false);
      setIsCreatingNew(false);
      // Revert to selectedEvaluation if available
      if (selectedEvaluation) {
        setLoadedEvaluationId(selectedEvaluation._id);
        setLoadedEvaluationStatus(selectedEvaluation.status);
        const newLevels: Record<string, CompetencyLevel> = {};
        const newRemarks: Record<string, string> = {};
        for (const entry of selectedEvaluation.entries) {
          newLevels[entry.competency._id] = entry.level;
          if (entry.remarks) newRemarks[entry.competency._id] = entry.remarks;
        }
        setLevels(newLevels);
        setRemarks(newRemarks);
        setGeneralNotes(selectedEvaluation.generalNotes || "");
        const savedDate =
          toManilaDateKey(selectedEvaluation.evaluationDate) ||
          getManilaDateKey();
        setEvaluationDate(savedDate);
        setSavedSnapshot(
          createSnapshot(
            newLevels,
            newRemarks,
            selectedEvaluation.generalNotes || "",
            savedDate,
          ),
        );
      }
    },
    loadEvaluation: loadEvaluationIntoForm,
    startNewEvaluation: () => {
      setIsCreatingNew(true);
      setLoadedEvaluationId(null);
      setLoadedEvaluationStatus(null);
      const today = getManilaDateKey();
      setLevels({});
      setRemarks({});
      setGeneralNotes("");
      setEvaluationDate(today);
      setIsEditing(true);
      setSavedSnapshot(createSnapshot({}, {}, "", today));
    },
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
      void handleEvaluationDateChange(value);
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
        reportHandledError("competency.draft.save", error);
        Alert.alert(
          "Unable to Save",
          getUserFriendlyErrorMessage(
            error,
            "The draft could not be saved on this device.",
          ),
        );
      }
    },
    submitEvaluation: async () => {
      if (isOffline) {
        Alert.alert(
          "Internet Required",
          "Connect to the internet to submit this evaluation.",
        );
        return false;
      }
      try {
        await saveLocalDraft();
        await mutation.mutateAsync("submitted");
        return true;
      } catch (error) {
        reportHandledError("competency.evaluation.submit", error);
        Alert.alert(
          "Unable to Save",
          getUserFriendlyErrorMessage(
            error,
            "The evaluation could not be submitted. Please try again.",
          ),
        );
        return false;
      }
    },
    isSubmitting: mutation.isPending || isDateLookupPending,
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

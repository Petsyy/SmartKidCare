import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import {
  getAttendanceForDate,
  getFeedingForDate,
  type FeedingRecord,
} from "@/src/api/records.api";
import type { Child } from "@/src/api/api.types";
import {
  formatManilaDateLabel,
  getManilaDateKey,
  isValidManilaDateKey,
} from "@/src/utils/manila-date";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useTeacherUi } from "@/src/context/teacher-ui-context";
import { useOffline } from "@/src/offline/offline-context";
import {
  finalizeDraft,
  getDraft,
  getOutboxOperation,
  saveDraft,
} from "@/src/offline/offline-store";
import type { FeedingDraftPayload } from "@/src/offline/offline.types";

const foodMenuOptions = [
  "Sinigang, Adobo",
  "Rice with Chicken Adobo",
  "Spaghetti with Meatballs",
  "Fried Rice with Vegetables",
  "Chicken Tinola",
  "Pork Sinigang",
  "Beef Caldereta",
  "Fish Fillet with Rice",
  "Pancit Canton",
  "Lumpia with Rice",
  "Other",
];

const buildSnapshot = (
  childIds: string[],
  foodServed: string,
  feedingStatus: Record<string, boolean>,
  feedingNotes: Record<string, string>,
) =>
  JSON.stringify({
    childIds: [...childIds].sort(),
    foodServed: foodServed.trim(),
    feedingStatus: childIds.reduce<Record<string, boolean>>((acc, childId) => {
      acc[childId] = Boolean(feedingStatus[childId]);
      return acc;
    }, {}),
    feedingNotes: childIds.reduce<Record<string, string>>((acc, childId) => {
      acc[childId] = String(feedingNotes[childId] ?? "").trim();
      return acc;
    }, {}),
  });

export const useTeacherFeeding = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { isConnected, isInternetReachable, synchronize, refreshPendingCount } = useOffline();

  const [children, setChildren] = useState<Child[]>([]);
  const [feedingStatus, setFeedingStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [feedingNotes, setFeedingNotes] = useState<Record<string, string>>({});
  const [foodServed, setFoodServed] = useState("");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const {
    feedingSearchQuery: searchQuery,
    setFeedingSearchQuery: setSearchQuery,
  } = useTeacherUi();

  const presentChildrenIds = useMemo(() => {
    try {
      return params.presentChildren
        ? (JSON.parse(params.presentChildren as string) as string[])
        : [];
    } catch {
      return [];
    }
  }, [params.presentChildren]);

  const presentChildrenIdsKey = useMemo(
    () => [...presentChildrenIds].sort().join(","),
    [presentChildrenIds],
  );

  const initialAttendanceDateKey = useMemo(() => {
    const rawDateKey = String(params.attendanceDateKey || "").trim();
    return isValidManilaDateKey(rawDateKey) ? rawDateKey : getManilaDateKey();
  }, [params.attendanceDateKey]);
  const [attendanceDateKey, setAttendanceDateKey] = useState(
    initialAttendanceDateKey,
  );

  useEffect(() => {
    // Route parameters are the source of truth when this screen is reused.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttendanceDateKey(initialAttendanceDateKey);
  }, [initialAttendanceDateKey]);

  const todayDateKey = useMemo(() => getManilaDateKey(), []);
  const isHistoricalDate = attendanceDateKey !== todayDateKey;

  const attendanceDateLabel = useMemo(() => {
    const explicitLabel = String(params.attendanceDateLabel || "").trim();
    if (explicitLabel) return explicitLabel;

    const legacyDateLabel = String(params.attendanceDate || "").trim();
    if (legacyDateLabel) {
      const parsedLegacy = new Date(legacyDateLabel);
      if (!Number.isNaN(parsedLegacy.getTime())) {
        return formatManilaDateLabel(parsedLegacy);
      }
    }

    return formatManilaDateLabel(attendanceDateKey);
  }, [attendanceDateKey, params.attendanceDate, params.attendanceDateLabel]);

  const interactionDisabled = isReadOnly || isSubmitting;

  const { data, isLoading } = useQuery({
    queryKey: mobileQueryKeys.teacherFeedingSetup(
      attendanceDateKey,
      presentChildrenIdsKey,
    ),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [childrenData, feedingRecord] = await Promise.all([
        getChildren(),
        getFeedingForDate(attendanceDateKey),
      ]);

      if (feedingRecord) {
        const recordedChildIds = new Set(
          feedingRecord.records.map((record: any) =>
            String(record.child?._id || record.child),
          ),
        );
        const childrenToShow = childrenData.filter((child) =>
          recordedChildIds.has(child._id),
        );
        const existingStatus: Record<string, boolean> = {};
        const existingNotes: Record<string, string> = {};

        feedingRecord.records.forEach((record: any) => {
          const childId = String(record.child?._id || record.child);
          existingStatus[childId] = record.status !== "completed";
          existingNotes[childId] = String(record.notes || "");
        });

        return {
          childrenToShow,
          isReadOnly: !isHistoricalDate,
          foodServed: String(feedingRecord.foodServed || ""),
          feedingStatus: existingStatus,
          feedingNotes: existingNotes,
        };
      }

      let childrenToShow: Child[] = [];
      if (!isHistoricalDate && presentChildrenIds.length > 0) {
        const presentIds = new Set(presentChildrenIds.map(String));
        childrenToShow = childrenData.filter((child) =>
          presentIds.has(child._id),
        );
      } else {
        const attendanceRecord = await getAttendanceForDate(attendanceDateKey);
        if (attendanceRecord?.records) {
          const presentIds = new Set(
            attendanceRecord.records
              .filter((record: any) => record.status === "present")
              .map((record: any) => String(record.child?._id || record.child)),
          );
          childrenToShow = childrenData.filter((child) =>
            presentIds.has(child._id),
          );
        } else if (isHistoricalDate) {
          childrenToShow = childrenData;
        }
      }

      const initialStatus: Record<string, boolean> = {};
      const initialNotes: Record<string, string> = {};
      childrenToShow.forEach((child) => {
        initialStatus[child._id] = true;
        initialNotes[child._id] = "";
      });

      return {
        childrenToShow,
        isReadOnly: false,
        foodServed: "",
        feedingStatus: initialStatus,
        feedingNotes: initialNotes,
      };
    },
  });

  useEffect(() => {
    if (!data) return;

    const childIds = data.childrenToShow.map((child) => child._id);
    // Query completion intentionally hydrates this multi-field editable draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChildren(data.childrenToShow);
    setIsReadOnly(data.isReadOnly);
    void (async () => {
      const draft = user?.id
        ? await getDraft(user.id, "feeding", attendanceDateKey)
        : null;
      if (!draft) {
        setFoodServed(data.foodServed);
        setFeedingStatus(data.feedingStatus);
        setFeedingNotes(data.feedingNotes);
        return;
      }
      const payload = draft.payload as FeedingDraftPayload;
      setFoodServed(payload.foodServed ?? "");
      setFeedingStatus(
        Object.fromEntries(
          data.childrenToShow.map((child) => [
            child._id,
            payload.records[child._id]?.status === "missed",
          ]),
        ),
      );
      setFeedingNotes(
        Object.fromEntries(
          data.childrenToShow.map((child) => [
            child._id,
            payload.records[child._id]?.notes ?? "",
          ]),
        ),
      );
    })();
    setSavedSnapshot(
      buildSnapshot(
        childIds,
        data.foodServed,
        data.feedingStatus,
        data.feedingNotes,
      ),
    );
  }, [attendanceDateKey, data, user?.id]);

  const filteredChildren = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return children;

    return children.filter((child) => {
      const fullName =
        `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [children, searchQuery]);

  const stats = useMemo(() => {
    const missed = Object.values(feedingStatus).filter(Boolean).length;
    const fed = children.length - missed;
    return { fed, missed, total: children.length };
  }, [feedingStatus, children.length]);

  const hasUnsavedChanges = useMemo(() => {
    if (!data || isReadOnly || savedSnapshot === null) return false;
    return (
      buildSnapshot(
        children.map((child) => child._id),
        foodServed,
        feedingStatus,
        feedingNotes,
      ) !== savedSnapshot
    );
  }, [
    children,
    data,
    feedingNotes,
    feedingStatus,
    foodServed,
    isReadOnly,
    savedSnapshot,
  ]);

  useEffect(() => {
    if (!user?.id || isReadOnly || children.length === 0) return;
    const timeout = setTimeout(() => {
      const payload: FeedingDraftPayload = {
        dateKey: attendanceDateKey,
        foodServed,
        records: Object.fromEntries(
          Object.entries(feedingStatus).map(([childId, isMissed]) => [
            childId,
            {
              status: isMissed ? "missed" : "completed",
              notes: feedingNotes[childId] ?? "",
            },
          ]),
        ),
      };
      void saveDraft({
        userId: user.id,
        recordType: "feeding",
        dateKey: attendanceDateKey,
        payload,
      });
    }, 600);
    return () => clearTimeout(timeout);
  }, [
    attendanceDateKey,
    children.length,
    feedingNotes,
    feedingStatus,
    foodServed,
    isReadOnly,
    user,
  ]);

  const toggleChildFeeding = useCallback((childId: string) => {
    setFeedingStatus((prev) => ({ ...prev, [childId]: !prev[childId] }));
  }, []);

  const setChildNote = useCallback((childId: string, value: string) => {
    setFeedingNotes((prev) => ({ ...prev, [childId]: value }));
  }, []);

  const markAllAsCompleted = useCallback(() => {
    const allFed: Record<string, boolean> = {};
    children.forEach((child) => {
      allFed[child._id] = false;
    });
    setFeedingStatus(allFed);
  }, [children]);

  const markAllAsMissed = useCallback(() => {
    const allMissed: Record<string, boolean> = {};
    children.forEach((child) => {
      allMissed[child._id] = true;
    });
    setFeedingStatus(allMissed);
  }, [children]);

  const submitFeedingRecord = useCallback(async () => {
    if (isSubmitting) return;
    if (isReadOnly) return;
    if (!user?.id) {
      throw new Error("You must be logged in to submit feeding records.");
    }
    if (!foodServed.trim()) {
      throw new Error("Please select the food served before submitting.");
    }

    const snapshot = buildSnapshot(
      children.map((child) => child._id),
      foodServed,
      feedingStatus,
      feedingNotes,
    );

    setIsSubmitting(true);
    try {
      const records: FeedingRecord[] = Object.entries(feedingStatus).map(
        ([childId, isMissed]) => ({
          child: childId,
          status: isMissed ? "missed" : "completed",
          notes: String(feedingNotes[childId] || "").trim(),
        }),
      );

      const draftPayload: FeedingDraftPayload = {
        dateKey: attendanceDateKey,
        foodServed: foodServed.trim(),
        records: Object.fromEntries(
          records.map((record) => [
            record.child,
            { status: record.status, notes: record.notes },
          ]),
        ),
      };
      const draft = await saveDraft({
        userId: user.id,
        recordType: "feeding",
        dateKey: attendanceDateKey,
        payload: draftPayload,
      });
      const operation = await finalizeDraft({
        draft,
        operationType: "feeding.create",
        completePayload: {
          date: attendanceDateKey,
          foodServed: foodServed.trim(),
          records,
        },
      });
      await refreshPendingCount();
      setSavedSnapshot(snapshot);
      setIsReadOnly(true);
      Alert.alert(
        "Queued for synchronization",
        "Feeding is securely queued and will synchronize when SmartKidCare is open and connected.",
      );
      if (isConnected && isInternetReachable && isAuthenticated) {
        await synchronize();
        if ((await getOutboxOperation(operation.clientOperationId)) === "synced") {
          setShowSuccessFeedback(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    attendanceDateKey,
    children,
    feedingNotes,
    feedingStatus,
    foodServed,
    isAuthenticated,
    isReadOnly,
    isSubmitting,
    user?.id,
    refreshPendingCount,
    isConnected,
    isInternetReachable,
    synchronize,
  ]);

  const handleSubmit = useCallback(async () => {
    if (isReadOnly) {
      router.push("/(teacher)");
      return;
    }

    try {
      await submitFeedingRecord();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit feeding records. Please try again.";
      Alert.alert("Unable to Submit", message);
      console.error("Feeding submission error:", error);
    }
  }, [isReadOnly, router, submitFeedingRecord]);

  const submitBeforeLeaving = useCallback(async () => {
    if (!user?.id || isReadOnly) return;
    const payload: FeedingDraftPayload = {
      dateKey: attendanceDateKey,
      foodServed,
      records: Object.fromEntries(
        Object.entries(feedingStatus).map(([childId, isMissed]) => [
          childId,
          {
            status: isMissed ? "missed" : "completed",
            notes: feedingNotes[childId] ?? "",
          },
        ]),
      ),
    };
    await saveDraft({
      userId: user.id,
      recordType: "feeding",
      dateKey: attendanceDateKey,
      payload,
    });
    await refreshPendingCount();
    Alert.alert("Draft saved on this device");
  }, [attendanceDateKey, feedingNotes, feedingStatus, foodServed, isReadOnly, refreshPendingCount, user]);

  return {
    router,
    children,
    loading: isLoading,
    feedingStatus,
    feedingNotes,
    foodServed,
    setFoodServed,
    searchQuery,
    setSearchQuery,
    showMenuModal,
    setShowMenuModal,
    showSuccessFeedback,
    dismissSuccessFeedback: () => setShowSuccessFeedback(false),
    isReadOnly,
    isSubmitting,
    presentChildrenIds,
    attendanceDateKey,
    attendanceDateLabel,
    isHistoricalDate,
    setAttendanceDateKey,
    interactionDisabled,
    filteredChildren,
    stats,
    hasUnsavedChanges,
    toggleChildFeeding,
    setChildNote,
    markAllAsCompleted,
    markAllAsMissed,
    handleSubmit,
    submitBeforeLeaving,
    foodMenuOptions,
    isOffline: !isConnected || !isInternetReachable,
  };
};

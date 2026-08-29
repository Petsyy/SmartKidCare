import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import {
  submitFeeding,
  getTodayFeeding,
  getTodayAttendance,
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
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

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

  const attendanceDateKey = useMemo(() => {
    const rawDateKey = String(params.attendanceDateKey || "").trim();
    return isValidManilaDateKey(rawDateKey) ? rawDateKey : getManilaDateKey();
  }, [params.attendanceDateKey]);

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
      const [childrenData, todayRecord] = await Promise.all([
        getChildren(),
        getTodayFeeding(),
      ]);

      if (todayRecord) {
        const recordedChildIds = new Set(
          todayRecord.records.map((record: any) =>
            String(record.child?._id || record.child),
          ),
        );
        const childrenToShow = childrenData.filter((child) =>
          recordedChildIds.has(child._id),
        );
        const existingStatus: Record<string, boolean> = {};
        const existingNotes: Record<string, string> = {};

        todayRecord.records.forEach((record: any) => {
          const childId = String(record.child?._id || record.child);
          existingStatus[childId] = record.status !== "completed";
          existingNotes[childId] = String(record.notes || "");
        });

        return {
          childrenToShow,
          isReadOnly: true,
          foodServed: String(todayRecord.foodServed || ""),
          feedingStatus: existingStatus,
          feedingNotes: existingNotes,
        };
      }

      let childrenToShow: Child[] = [];
      if (presentChildrenIds.length > 0) {
        const presentIds = new Set(presentChildrenIds.map(String));
        childrenToShow = childrenData.filter((child) =>
          presentIds.has(child._id),
        );
      } else {
        const todayAttendance = await getTodayAttendance();
        if (todayAttendance?.records) {
          const presentIds = new Set(
            todayAttendance.records
              .filter((record: any) => record.status === "present")
              .map((record: any) => String(record.child?._id || record.child)),
          );
          childrenToShow = childrenData.filter((child) =>
            presentIds.has(child._id),
          );
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

  const submitFeedingMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      foodServed: string;
      records: FeedingRecord[];
    }) => submitFeeding(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacherFeedingSetup"] });
      void queryClient.invalidateQueries({ queryKey: ["teacherDashboard"] });
    },
  });

  useEffect(() => {
    if (!data) return;

    const childIds = data.childrenToShow.map((child) => child._id);
    setChildren(data.childrenToShow);
    setIsReadOnly(data.isReadOnly);
    setFoodServed(data.foodServed);
    setFeedingStatus(data.feedingStatus);
    setFeedingNotes(data.feedingNotes);
    setSavedSnapshot(
      buildSnapshot(
        childIds,
        data.foodServed,
        data.feedingStatus,
        data.feedingNotes,
      ),
    );
  }, [data]);

  const filteredChildren = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return children;

    return children.filter((child) => {
      const fullName =
        `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
      const studentId = String(child.studentId || "").toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
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
    if (!isAuthenticated) {
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

      await submitFeedingMutation.mutateAsync({
        date: attendanceDateKey,
        foodServed: foodServed.trim(),
        records,
      });

      setSavedSnapshot(snapshot);
      setIsReadOnly(true);
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
    submitFeedingMutation,
  ]);

  const handleSubmit = useCallback(async () => {
    if (isReadOnly) {
      router.push("/(teacher)");
      return;
    }

    try {
      await submitFeedingRecord();
      setShowSuccessFeedback(true);
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
    try {
      await submitFeedingRecord();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit feeding records. Please try again.";
      Alert.alert("Unable to Submit", message);
      console.error("Feeding save-before-leave error:", error);
      throw error;
    }
  }, [submitFeedingRecord]);

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
  };
};

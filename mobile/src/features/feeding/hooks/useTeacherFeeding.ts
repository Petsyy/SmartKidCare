import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import {
  submitFeeding,
  getTodayFeeding,
  getTodayAttendance,
  type FeedingRecord,
} from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";
import {
  formatManilaDateLabel,
  getManilaDateKey,
  isValidManilaDateKey,
} from "@/src/utils/manila-date";
import { useMutation, useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useTeacherUiStore } from "@/src/features/teacher/stores/teacher-ui.store";

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

export const useTeacherFeeding = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [feedingStatus, setFeedingStatus] = useState<Record<string, boolean>>({});
  const [foodServed, setFoodServed] = useState("");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { feedingSearchQuery: searchQuery, setFeedingSearchQuery: setSearchQuery } =
    useTeacherUiStore();

  const presentChildrenIds = useMemo(() => {
    try {
      return params.presentChildren ? (JSON.parse(params.presentChildren as string) as string[]) : [];
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
      token,
      attendanceDateKey,
      presentChildrenIdsKey,
    ),
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      const [childrenData, todayRecord] = await Promise.all([
        getChildren(token),
        getTodayFeeding(token),
      ]);

      if (todayRecord) {
        const recordedChildIds = new Set(
          todayRecord.records.map((r: any) => String(r.child._id || r.child)),
        );
        const childrenToShow = childrenData.filter((child) =>
          recordedChildIds.has(child._id),
        );
        const existingStatus: Record<string, boolean> = {};
        todayRecord.records.forEach((record: any) => {
          existingStatus[String(record.child._id || record.child)] =
            record.status !== "completed";
        });
        return {
          childrenToShow,
          isReadOnly: true,
          foodServed: String(todayRecord.foodServed || ""),
          feedingStatus: existingStatus,
        };
      }

      let childrenToShow: Child[] = [];
      if (presentChildrenIds.length > 0) {
        const presentIds = new Set(presentChildrenIds.map(String));
        childrenToShow = childrenData.filter((child) => presentIds.has(child._id));
      } else {
        const todayAttendance = await getTodayAttendance(token);
        if (todayAttendance?.records) {
          const presentIds = new Set(
            todayAttendance.records
              .filter((r: any) => r.status === "present")
              .map((r: any) => String(r.child._id || r.child)),
          );
          childrenToShow = childrenData.filter((child) => presentIds.has(child._id));
        }
      }

      const initialStatus: Record<string, boolean> = {};
      childrenToShow.forEach((child) => {
        initialStatus[child._id] = true;
      });
      return {
        childrenToShow,
        isReadOnly: false,
        foodServed: "",
        feedingStatus: initialStatus,
      };
    },
  });
  const submitFeedingMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      foodServed: string;
      records: FeedingRecord[];
    }) => {
      if (!token) throw new Error("No authentication token");
      return submitFeeding(token, payload);
    },
  });

  useEffect(() => {
    if (!data) return;
    setChildren(data.childrenToShow);
    setIsReadOnly(data.isReadOnly);
    setFoodServed(data.foodServed);
    setFeedingStatus(data.feedingStatus);
  }, [data]);

  const filteredChildren = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return children;

    return children.filter((child) => {
      const fullName = `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
      const studentId = String(child.studentId || "").toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
    });
  }, [children, searchQuery]);

  const stats = useMemo(() => {
    const missed = Object.values(feedingStatus).filter(Boolean).length;
    const fed = children.length - missed;
    return { fed, missed, total: children.length };
  }, [feedingStatus, children.length]);

  const toggleChildFeeding = useCallback((childId: string) => {
    setFeedingStatus((prev) => ({
      ...prev,
      [childId]: !prev[childId],
    }));
  }, []);

  const markAllAsCompleted = useCallback(() => {
    const allFed: Record<string, boolean> = {};
    children.forEach((child) => {
      allFed[child._id] = false;
    });
    setFeedingStatus(allFed);
  }, [children]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (isReadOnly) {
      router.push("/(teacher)");
      return;
    }

    if (!token) {
      Alert.alert("Authentication Error", "You must be logged in to submit feeding records.");
      return;
    }

    if (!foodServed) {
      Alert.alert("Validation Error", "Please select food served");
      return;
    }

    setIsSubmitting(true);
    try {
      const records: FeedingRecord[] = Object.entries(feedingStatus).map(([childId, isMissed]) => ({
        child: childId,
        status: !isMissed ? ("completed" as const) : ("missed" as const),
      }));

      await submitFeedingMutation.mutateAsync({
        date: attendanceDateKey,
        foodServed,
        records,
      });

      Alert.alert("Success", "Records saved successfully!", [{ text: "OK", onPress: () => router.push("/(teacher)") }]);
    } catch (error) {
      Alert.alert("Submission Error", "Failed to submit feeding records. Please try again.");
      console.error("Feeding submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    children,
    loading: isLoading,
    feedingStatus,
    foodServed,
    setFoodServed,
    searchQuery,
    setSearchQuery,
    showMenuModal,
    setShowMenuModal,
    isReadOnly,
    isSubmitting,
    presentChildrenIds,
    attendanceDateKey,
    attendanceDateLabel,
    interactionDisabled,
    filteredChildren,
    stats,
    toggleChildFeeding,
    markAllAsCompleted,
    handleSubmit,
    router,
    foodMenuOptions,
  };
};

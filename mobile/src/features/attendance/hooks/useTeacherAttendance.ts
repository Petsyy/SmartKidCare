import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import { submitAttendance, getTodayAttendance } from "@/src/api/records.api";
import type { Child } from "@/src/api/api.types";
import {
  formatManilaDateLabel,
  getManilaDateKey,
} from "@/src/utils/manila-date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useTeacherUi } from "@/src/context/teacher-ui-context";

export const useTeacherAttendance = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const {
    attendanceSearchQuery: searchQuery,
    setAttendanceSearchQuery: setSearchQuery,
  } = useTeacherUi();

  const selectedDateKey = useMemo(() => getManilaDateKey(), []);
  const selectedDateLabel = useMemo(
    () => formatManilaDateLabel(selectedDateKey),
    [selectedDateKey],
  );
  const { data, isLoading } = useQuery({
    queryKey: mobileQueryKeys.teacherAttendanceSetup(selectedDateKey),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [childrenData, todayRecord] = await Promise.all([
        getChildren(),
        getTodayAttendance(),
      ]);
      return { childrenData, todayRecord };
    },
  });
  const submitAttendanceMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      records: { child: string; status: "present" | "absent" }[];
    }) => {
      return submitAttendance(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["teacherAttendanceSetup"],
      });
      void queryClient.invalidateQueries({ queryKey: ["teacherFeedingSetup"] });
      void queryClient.invalidateQueries({ queryKey: ["teacherDashboard"] });
    },
  });
  const children = useMemo<Child[]>(
    () => data?.childrenData || [],
    [data?.childrenData],
  );

  useEffect(() => {
    if (!data) return;
    if (data.todayRecord) {
      setIsReadOnly(true);
      const existingAttendance: Record<string, boolean> = {};
      data.todayRecord.records.forEach((record: any) => {
        existingAttendance[record.child._id || record.child] =
          record.status === "present";
      });
      setAttendance(existingAttendance);
    } else {
      setIsReadOnly(false);
      const initialAttendance: Record<string, boolean> = {};
      data.childrenData.forEach((child) => {
        initialAttendance[child._id] = false;
      });
      setAttendance(initialAttendance);
    }
  }, [data]);

  useEffect(() => {
    setAttendance((currentAttendance) => {
      const nextAttendance: Record<string, boolean> = {};

      if (!isReadOnly) {
        children.forEach((child) => {
          nextAttendance[child._id] = currentAttendance[child._id] ?? false;
        });
        return nextAttendance;
      }

      children.forEach((child) => {
        if (currentAttendance[child._id] !== undefined) {
          nextAttendance[child._id] = currentAttendance[child._id];
        }
      });

      return Object.keys(nextAttendance).length > 0
        ? nextAttendance
        : currentAttendance;
    });
  }, [children, isReadOnly]);

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const fullName =
        `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        child.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [children, searchQuery]);

  const stats = useMemo(() => {
    const present = Object.values(attendance).filter(Boolean).length;
    const absent = children.length - present;
    return { present, absent, total: children.length };
  }, [attendance, children.length]);

  const toggleAttendance = (childId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [childId]: !prev[childId],
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, boolean> = {};
    children.forEach((child) => {
      allPresent[child._id] = true;
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<string, boolean> = {};
    children.forEach((child) => {
      allAbsent[child._id] = false;
    });
    setAttendance(allAbsent);
  };

  const handleSubmit = async () => {
    if (submitAttendanceMutation.isPending) return;

    if (!isAuthenticated) {
      Alert.alert(
        "Unable to Submit",
        "Please sign in again before submitting attendance.",
      );
      return;
    }

    try {
      if (isReadOnly) {
        Alert.alert(
          "Attendance Submitted",
          "Attendance has already been submitted.",
        );
        return;
      }

      const records = Object.entries(attendance).map(
        ([childId, isPresent]) => ({
          child: childId,
          status: isPresent ? ("present" as const) : ("absent" as const),
        }),
      );

      await submitAttendanceMutation.mutateAsync({
        date: selectedDateKey,
        records,
      });

      setIsReadOnly(true);
      setShowSuccessFeedback(true);
    } catch (error: any) {
      console.error("Failed to submit attendance:", error);
      Alert.alert(
        "Unable to Submit",
        error.message || "Attendance could not be submitted. Please try again.",
      );
    }
  };

  return {
    children,
    loading: isLoading,
    attendance,
    searchQuery,
    setSearchQuery,
    selectedDateKey,
    selectedDateLabel,
    isReadOnly,
    setIsReadOnly,
    filteredChildren,
    stats,
    toggleAttendance,
    markAllPresent,
    markAllAbsent,
    handleSubmit,
    isSubmitting: submitAttendanceMutation.isPending,
    showSuccessFeedback,
    dismissSuccessFeedback: () => setShowSuccessFeedback(false),
    router,
  };
};

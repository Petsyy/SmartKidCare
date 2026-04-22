import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import { submitAttendance, getTodayAttendance } from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";
import { formatManilaDateLabel, getManilaDateKey } from "@/src/utils/manila-date";
import { useMutation, useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useTeacherUiStore } from "@/src/features/teacher/stores/teacher-ui.store";

export const useTeacherAttendance = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { attendanceSearchQuery: searchQuery, setAttendanceSearchQuery: setSearchQuery } =
    useTeacherUiStore();

  const selectedDateKey = useMemo(() => getManilaDateKey(), []);
  const selectedDateLabel = useMemo(
    () => formatManilaDateLabel(selectedDateKey),
    [selectedDateKey],
  );
  const { data, isLoading } = useQuery({
    queryKey: mobileQueryKeys.teacherAttendanceSetup(token, selectedDateKey),
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      const [childrenData, todayRecord] = await Promise.all([
        getChildren(token),
        getTodayAttendance(token),
      ]);
      return { childrenData, todayRecord };
    },
  });
  const submitAttendanceMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      records: Array<{ child: string; status: "present" | "absent" }>;
    }) => {
      if (!token) throw new Error("Not authenticated");
      return submitAttendance(token, payload);
    },
  });
  const children: Child[] = data?.childrenData || [];

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
    if (!isReadOnly) {
      const nextAttendance: Record<string, boolean> = {};
      children.forEach((child) => {
        nextAttendance[child._id] = attendance[child._id] ?? false;
      });
      setAttendance(nextAttendance);
    } else {
      const nextAttendance: Record<string, boolean> = {};
      children.forEach((child) => {
        if (attendance[child._id] !== undefined) {
          nextAttendance[child._id] = attendance[child._id];
        }
      });
      if (Object.keys(nextAttendance).length > 0) {
        setAttendance(nextAttendance);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children.length, isReadOnly]);

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const fullName = `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
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
    if (!token) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    try {
      const presentChildrenIds = Object.entries(attendance)
        .filter(([_, isPresent]) => isPresent)
        .map(([childId]) => childId);

      if (isReadOnly) {
        router.push({
          pathname: "/(teacher)/teacher-record-data/feeding",
          params: {
            presentChildren: JSON.stringify(presentChildrenIds),
            attendanceDateKey: selectedDateKey,
            attendanceDateLabel: selectedDateLabel,
          },
        });
        return;
      }

      const records = Object.entries(attendance).map(([childId, isPresent]) => ({
        child: childId,
        status: isPresent ? ("present" as const) : ("absent" as const),
      }));

      await submitAttendanceMutation.mutateAsync({
        date: selectedDateKey,
        records,
      });

      router.push({
        pathname: "/(teacher)/teacher-record-data/feeding",
        params: {
          presentChildren: JSON.stringify(presentChildrenIds),
          attendanceDateKey: selectedDateKey,
          attendanceDateLabel: selectedDateLabel,
        },
      });
    } catch (error: any) {
      console.error("Failed to submit attendance:", error);
      Alert.alert("Error", error.message || "Failed to submit attendance");
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
    router,
  };
};

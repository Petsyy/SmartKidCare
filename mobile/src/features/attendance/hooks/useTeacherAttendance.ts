import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import { getAttendanceForDate } from "@/src/api/records.api";
import type { Child } from "@/src/api/api.types";
import {
  formatManilaDateLabel,
  getManilaDateKey,
} from "@/src/utils/manila-date";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useTeacherUi } from "@/src/context/teacher-ui-context";
import { useOffline } from "@/src/offline/offline-context";
import {
  finalizeDraft,
  getDraft,
  getOutboxOperation,
  saveDraft,
} from "@/src/offline/offline-store";
import type { AttendanceDraftPayload } from "@/src/offline/offline.types";

type AttendanceChildStatus = "present" | "absent";

export const useTeacherAttendance = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { isConnected, isInternetReachable, synchronize, refreshPendingCount } =
    useOffline();
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceChildStatus | undefined>
  >({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const {
    attendanceSearchQuery: searchQuery,
    setAttendanceSearchQuery: setSearchQuery,
  } = useTeacherUi();

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    getManilaDateKey(),
  );
  const selectedDateLabel = useMemo(
    () => formatManilaDateLabel(selectedDateKey),
    [selectedDateKey],
  );
  const { data, isLoading } = useQuery({
    queryKey: mobileQueryKeys.teacherAttendanceSetup(selectedDateKey),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [childrenData, attendanceRecord] = await Promise.all([
        getChildren(),
        getAttendanceForDate(selectedDateKey),
      ]);
      return { childrenData, attendanceRecord };
    },
  });
  const children = useMemo<Child[]>(
    () => data?.childrenData || [],
    [data?.childrenData],
  );

  useEffect(() => {
    if (!data) return;
    if (data.attendanceRecord) {
      // Query completion intentionally hydrates the editable attendance draft.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReadOnly(true);
      const existingAttendance: Record<string, AttendanceChildStatus> = {};
      data.attendanceRecord.records.forEach((record: any) => {
        existingAttendance[record.child._id || record.child] = record.status;
      });
      setAttendance(existingAttendance);
    } else {
      setIsReadOnly(false);
      const initialAttendance: Record<
        string,
        AttendanceChildStatus | undefined
      > = {};
      data.childrenData.forEach((child) => {
        initialAttendance[child._id] = undefined;
      });
      void (async () => {
        const draft = user?.id
          ? await getDraft(user.id, "attendance", selectedDateKey)
          : null;
        if (draft) {
          const payload = draft.payload as AttendanceDraftPayload;
          data.childrenData.forEach((child) => {
            const status = payload.records[child._id]?.status;
            initialAttendance[child._id] = status;
          });
        }
        setAttendance(initialAttendance);
      })();
    }
  }, [data, selectedDateKey, user?.id]);

  useEffect(() => {
    // Keep draft keys aligned when the assigned-child query changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttendance((currentAttendance) => {
      const nextAttendance: Record<string, AttendanceChildStatus | undefined> =
        {};

      if (!isReadOnly) {
        children.forEach((child) => {
          nextAttendance[child._id] = currentAttendance[child._id] ?? "absent";
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

  useEffect(() => {
    if (!user?.id || isReadOnly || children.length === 0) return;
    const timeout = setTimeout(() => {
      const payload: AttendanceDraftPayload = {
        dateKey: selectedDateKey,
        records: Object.fromEntries(
          Object.entries(attendance).map(([childId, status]) => [
            childId,
            {
              status,
            },
          ]),
        ),
      };
      void saveDraft({
        userId: user.id,
        recordType: "attendance",
        dateKey: selectedDateKey,
        payload,
      });
    }, 600);
    return () => clearTimeout(timeout);
  }, [attendance, children.length, isReadOnly, selectedDateKey, user]);

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const fullName =
        `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [children, searchQuery]);

  const stats = useMemo(() => {
    const present = Object.values(attendance).filter(
      (status) => status === "present",
    ).length;
    const absent = children.length - present;
    return { present, absent, total: children.length };
  }, [attendance, children.length]);

  const toggleAttendance = (childId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [childId]: prev[childId] === "present" ? "absent" : "present",
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceChildStatus> = {};
    children.forEach((child) => {
      allPresent[child._id] = "present";
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<string, AttendanceChildStatus> = {};
    children.forEach((child) => {
      allAbsent[child._id] = "absent";
    });
    setAttendance(allAbsent);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
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

      const records = Object.entries(attendance).map(([childId, status]) => ({
        child: childId,
        status: status ?? "absent",
      }));
      if (
        records.length === 0 ||
        Object.values(attendance).some((value) => value === undefined)
      ) {
        throw new Error(
          "Mark every child present or absent before submitting.",
        );
      }
      const draftPayload: AttendanceDraftPayload = {
        dateKey: selectedDateKey,
        records: Object.fromEntries(
          Object.entries(attendance).map(([childId, status]) => [
            childId,
            {
              status,
            },
          ]),
        ),
      };
      const draft = await saveDraft({
        userId: user.id,
        recordType: "attendance",
        dateKey: selectedDateKey,
        payload: draftPayload,
      });
      const operation = await finalizeDraft({
        draft,
        operationType: "attendance.create",
        completePayload: { date: selectedDateKey, records },
      });
      await refreshPendingCount();
      setIsReadOnly(true);
      Alert.alert(
        "Queued for synchronization",
        "Attendance is securely queued and will synchronize when SmartKidCare is open and connected.",
      );
      if (isConnected && isInternetReachable && isAuthenticated) {
        await synchronize();
        if (
          (await getOutboxOperation(operation.clientOperationId)) === "synced"
        ) {
          setShowSuccessFeedback(true);
        }
      }
    } catch (error: any) {
      console.error("Failed to submit attendance:", error);
      Alert.alert(
        "Unable to Submit",
        error.message || "Attendance could not be submitted. Please try again.",
      );
    }
  };

  const saveDraftAndLeave = async () => {
    if (!user?.id || isReadOnly) return;
    const payload: AttendanceDraftPayload = {
      dateKey: selectedDateKey,
      records: Object.fromEntries(
        Object.entries(attendance).map(([childId, status]) => [
          childId,
          {
            status,
          },
        ]),
      ),
    };
    await saveDraft({
      userId: user.id,
      recordType: "attendance",
      dateKey: selectedDateKey,
      payload,
    });
    await refreshPendingCount();
    Alert.alert(
      "Draft saved on this device",
      "You can return to this draft later on this device.",
    );
    router.back();
  };

  return {
    children,
    loading: isLoading,
    attendance,
    searchQuery,
    setSearchQuery,
    selectedDateKey,
    setSelectedDateKey,
    selectedDateLabel,
    isReadOnly,
    setIsReadOnly,
    filteredChildren,
    stats,
    toggleAttendance,
    markAllPresent,
    markAllAbsent,
    handleSubmit,
    saveDraftAndLeave,
    isOffline: !isConnected || !isInternetReachable,
    isSubmitting: false,
    showSuccessFeedback,
    dismissSuccessFeedback: () => setShowSuccessFeedback(false),
    router,
  };
};

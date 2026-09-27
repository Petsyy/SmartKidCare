import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import { getTodayAttendance } from "@/src/api/records.api";
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

export const useTeacherAttendance = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { isConnected, isInternetReachable, synchronize, refreshPendingCount } = useOffline();
  const [attendance, setAttendance] = useState<Record<string, boolean | undefined>>({});
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
  const children = useMemo<Child[]>(
    () => data?.childrenData || [],
    [data?.childrenData],
  );

  useEffect(() => {
    if (!data) return;
    if (data.todayRecord) {
      // Query completion intentionally hydrates the editable attendance draft.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReadOnly(true);
      const existingAttendance: Record<string, boolean> = {};
      data.todayRecord.records.forEach((record: any) => {
        existingAttendance[record.child._id || record.child] =
          record.status === "present";
      });
      setAttendance(existingAttendance);
    } else {
      setIsReadOnly(false);
      const initialAttendance: Record<string, boolean | undefined> = {};
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
            initialAttendance[child._id] =
              status === "present" ? true : status === "absent" ? false : undefined;
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
      const nextAttendance: Record<string, boolean | undefined> = {};

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

  useEffect(() => {
    if (!user?.id || isReadOnly || children.length === 0) return;
    const timeout = setTimeout(() => {
      const payload: AttendanceDraftPayload = {
        dateKey: selectedDateKey,
        records: Object.fromEntries(
          Object.entries(attendance).map(([childId, isPresent]) => [
            childId,
            {
              status:
                isPresent === undefined
                  ? undefined
                  : isPresent
                    ? "present"
                    : "absent",
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
    const present = Object.values(attendance).filter(Boolean).length;
    const absent = children.length - present;
    return { present, absent, total: children.length };
  }, [attendance, children.length]);

  const toggleAttendance = (childId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [childId]: prev[childId] === true ? false : true,
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

      const records = Object.entries(attendance).map(
        ([childId, isPresent]) => ({
          child: childId,
          status: isPresent ? ("present" as const) : ("absent" as const),
        }),
      );
      if (records.length === 0 || Object.values(attendance).some((value) => value === undefined)) {
        throw new Error("Mark every child present or absent before submitting.");
      }
      const draftPayload: AttendanceDraftPayload = {
        dateKey: selectedDateKey,
        records: Object.fromEntries(
          Object.entries(attendance).map(([childId, isPresent]) => [
            childId,
            {
              status:
                isPresent === undefined
                  ? undefined
                  : isPresent
                    ? "present"
                    : "absent",
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
        if ((await getOutboxOperation(operation.clientOperationId)) === "synced") {
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
        Object.entries(attendance).map(([childId, isPresent]) => [
          childId,
          {
            status:
              isPresent === undefined
                ? undefined
                : isPresent
                  ? "present"
                  : "absent",
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
    Alert.alert("Draft saved on this device");
    router.back();
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
    saveDraftAndLeave,
    isOffline: !isConnected || !isInternetReachable,
    isSubmitting: false,
    showSuccessFeedback,
    dismissSuccessFeedback: () => setShowSuccessFeedback(false),
    router,
  };
};

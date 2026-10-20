import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChildren } from "@/src/api/teacher.api";
import { getAttendanceForDate, updateAttendance } from "@/src/api/records.api";
import type { AttendanceRecord, Child } from "@/src/api/api.types";
import { useAuth } from "@/src/hooks/use-auth";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useTeacherUi } from "@/src/context/teacher-ui-context";
import { useOffline } from "@/src/offline/offline-context";
import {
  finalizeDraft,
  getDraft,
  getOutboxByDate,
  getOutboxOperation,
  saveDraft,
} from "@/src/offline/offline-store";
import type { AttendanceDraftPayload } from "@/src/offline/offline.types";
import {
  onlineWithOfflineFallback,
  readOfflineRecordForDate,
  readOfflineResource,
} from "@/src/offline/offline-read";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";
import {
  formatManilaDateLabel,
  getManilaDateKey,
} from "@/src/utils/manila-date";
import { sortChildrenByName } from "@/src/utils/child-name";

export type AttendanceStatus = AttendanceRecord["status"];
export type ExcuseReason = NonNullable<AttendanceRecord["excuseReason"]>;
export type AttendanceFilter = "all" | "unmarked" | AttendanceStatus;
export type AttendanceSelection = Omit<AttendanceRecord, "child">;

const toDraftRecords = (
  attendance: Record<string, AttendanceSelection | undefined>,
): AttendanceDraftPayload["records"] =>
  Object.fromEntries(
    Object.entries(attendance).map(([childId, selection]) => [
      childId,
      selection ?? {},
    ]),
  );

export const useTeacherAttendance = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { authState, isAuthenticated, user } = useAuth();
  const { isConnected, isInternetReachable, synchronize, refreshPendingCount } =
    useOffline();
  const isOffline =
    authState === "offlineAuthenticated" ||
    !isConnected ||
    !isInternetReachable;
  const canReadAttendance =
    isAuthenticated || authState === "offlineAuthenticated";
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceSelection | undefined>
  >({});
  const attendanceRef = useRef(attendance);
  useEffect(() => {
    attendanceRef.current = attendance;
  }, [attendance]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalAttendance, setOriginalAttendance] = useState<
    Record<string, AttendanceSelection | undefined>
  >({});
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [excuseEditor, setExcuseEditor] = useState<{
    childId: string;
    reason: ExcuseReason | null;
    notes: string;
  } | null>(null);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [successWasEdit, setSuccessWasEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydratedDataUpdatedAt, setHydratedDataUpdatedAt] = useState(0);
  const {
    attendanceSearchQuery: searchQuery,
    setAttendanceSearchQuery: setSearchQuery,
  } = useTeacherUi();

  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const requested = String(params.selectedDateKey || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(requested)
      ? requested
      : getManilaDateKey();
  });
  const returnToFeeding = String(params.returnToFeeding || "") === "true";
  const backRoute = returnToFeeding
    ? ({
        pathname: "/(teacher)/teacher-record-data/feeding",
        params: { attendanceDateKey: selectedDateKey },
      } as const)
    : ("/(teacher)" as const);
  const selectedDateLabel = useMemo(
    () => formatManilaDateLabel(selectedDateKey),
    [selectedDateKey],
  );

  const { data, dataUpdatedAt, isLoading, refetch } = useQuery({
    queryKey: mobileQueryKeys.teacherAttendanceSetup(selectedDateKey),
    networkMode: "always",
    refetchOnMount: "always",
    enabled: canReadAttendance && Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return { childrenData: [], attendanceRecord: null };
      const [childrenData, serverRecord, localOperation] = await Promise.all([
        onlineWithOfflineFallback(isOffline, getChildren, () =>
          readOfflineResource<Child>(user.id, "children"),
        ),
        onlineWithOfflineFallback(
          isOffline,
          () => getAttendanceForDate(selectedDateKey),
          () =>
            readOfflineRecordForDate<any>(
              user.id,
              "attendance",
              selectedDateKey,
            ),
        ),
        getOutboxByDate(user.id, "attendance.create", selectedDateKey),
      ]);
      const localRecord = localOperation
        ? {
            date: selectedDateKey,
            records: (localOperation.frozenPayload as any).records,
            localPending: localOperation.status !== "synced",
          }
        : null;
      return {
        childrenData,
        attendanceRecord:
          localOperation && localOperation.status !== "synced"
            ? localRecord
            : (serverRecord ?? localRecord),
      };
    },
  });
  const children = useMemo<Child[]>(
    () => sortChildrenByName(data?.childrenData ?? []),
    [data?.childrenData],
  );

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    void (async () => {
      const record = data.attendanceRecord;
      if (record) {
        const hydrated: Record<string, AttendanceSelection> = {};
        record.records.forEach((item: any) => {
          hydrated[item.child?._id ?? item.child] = {
            status: item.status,
            ...(item.excuseReason ? { excuseReason: item.excuseReason } : {}),
            ...(item.notes ? { notes: item.notes } : {}),
          };
        });
        await Promise.resolve();
        if (cancelled) return;
        setAttendance(hydrated);
        setOriginalAttendance(hydrated);
        setIsReadOnly(true);
        setIsEditing(false);
        setHydratedDataUpdatedAt(dataUpdatedAt);
        return;
      }
      const neutral: Record<string, AttendanceSelection | undefined> = {};
      children.forEach((child) => {
        neutral[child._id] = undefined;
      });
      const draft = user?.id
        ? await getDraft(user.id, "attendance", selectedDateKey)
        : null;
      if (draft) {
        const saved = (draft.payload as AttendanceDraftPayload).records;
        children.forEach((child) => {
          const item = saved[child._id];
          if (item?.status) neutral[child._id] = item as AttendanceSelection;
        });
      }
      if (cancelled) return;
      setAttendance(neutral);
      setOriginalAttendance(neutral);
      setIsReadOnly(false);
      setIsEditing(false);
      setHydratedDataUpdatedAt(dataUpdatedAt);
    })();
    return () => {
      cancelled = true;
    };
  }, [children, data, dataUpdatedAt, selectedDateKey, user?.id]);

  const editable = !isReadOnly || isEditing;
  useEffect(() => {
    if (!user?.id || !editable || isEditing || children.length === 0) return;
    const timeout = setTimeout(() => {
      void saveDraft({
        userId: user.id,
        recordType: "attendance",
        dateKey: selectedDateKey,
        payload: {
          dateKey: selectedDateKey,
          records: toDraftRecords(attendance),
        },
      });
    }, 600);
    return () => clearTimeout(timeout);
  }, [
    attendance,
    children.length,
    editable,
    isEditing,
    selectedDateKey,
    user?.id,
  ]);

  const filteredChildren = useMemo(
    () =>
      children.filter((child) => {
        const selection = attendance[child._id];
        const matchesFilter =
          filter === "all" ||
          (filter === "unmarked"
            ? !selection?.status
            : selection?.status === filter);
        const fullName =
          `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
        return matchesFilter && fullName.includes(searchQuery.toLowerCase());
      }),
    [attendance, children, filter, searchQuery],
  );

  const stats = useMemo(() => {
    const values = Object.values(attendance);
    const count = (status: AttendanceStatus) =>
      values.filter((item) => item?.status === status).length;
    const present = count("present");
    const absent = count("absent");
    const excused = count("excused");
    return {
      present,
      absent,
      excused,
      unmarked: Math.max(0, children.length - present - absent - excused),
      total: children.length,
    };
  }, [attendance, children.length]);

  const changeSummary = useMemo(
    () =>
      children.flatMap((child) => {
        const beforeSelection = originalAttendance[child._id];
        const afterSelection = attendance[child._id];
        const before = beforeSelection?.status;
        const after = afterSelection?.status;
        if (!before || !after) return [];
        if (
          before === after &&
          beforeSelection?.excuseReason === afterSelection?.excuseReason &&
          (beforeSelection?.notes ?? "") === (afterSelection?.notes ?? "")
        )
          return [];
        return [
          `${child.firstName} ${child.lastName}: ${before === after ? "excuse details updated" : `${before} → ${after}`}`,
        ];
      }),
    [attendance, children, originalAttendance],
  );

  const setStatus = useCallback(
    (childId: string, status: AttendanceStatus) => {
      if (!editable) return;
      if (status === "excused") {
        const current = attendanceRef.current[childId];
        setExcuseEditor({
          childId,
          reason: current?.excuseReason ?? null,
          notes: current?.notes ?? "",
        });
        return;
      }
      setAttendance((current) => ({ ...current, [childId]: { status } }));
    },
    [editable],
  );

  const confirmExcused = () => {
    if (!excuseEditor?.reason) return false;
    if (excuseEditor.reason === "other" && !excuseEditor.notes.trim()) {
      return false;
    }
    setAttendance((current) => ({
      ...current,
      [excuseEditor.childId]: {
        status: "excused",
        excuseReason: excuseEditor.reason!,
        ...(excuseEditor.notes.trim()
          ? { notes: excuseEditor.notes.trim() }
          : {}),
      },
    }));
    setExcuseEditor(null);
    return true;
  };

  const invalidateAttendanceQueries = async () => {
    await queryClient.invalidateQueries();
  };

  const handleSubmit = async () => {
    if (!user?.id || isSubmitting) return;
    if (stats.unmarked > 0) {
      Alert.alert(
        "Attendance incomplete",
        `Mark the remaining ${stats.unmarked} ${stats.unmarked === 1 ? "child" : "children"} before finalizing.`,
      );
      return;
    }
    const records: AttendanceRecord[] = children.map((child) => ({
      child: child._id,
      ...attendance[child._id]!,
    }));
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const record = data?.attendanceRecord;
        if (isOffline || !record?._id) {
          Alert.alert(
            "Internet required",
            "Connect to the internet to edit finalized attendance.",
          );
          return;
        }
        await updateAttendance(record._id, {
          clientOperationId: Crypto.randomUUID(),
          expectedVersion: Number(record.version ?? 0),
          records,
        });
        setIsEditing(false);
        setIsReadOnly(true);
        setOriginalAttendance(attendance);
        setSuccessWasEdit(true);
        await invalidateAttendanceQueries();
        await refetch();
        setShowSuccessFeedback(true);
        return;
      }
      const draft = await saveDraft({
        userId: user.id,
        recordType: "attendance",
        dateKey: selectedDateKey,
        payload: {
          dateKey: selectedDateKey,
          records: toDraftRecords(attendance),
        },
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
          await invalidateAttendanceQueries();
          setSuccessWasEdit(false);
          setShowSuccessFeedback(true);
        }
      }
      if (returnToFeeding) {
        router.replace({
          pathname: "/(teacher)/teacher-record-data/feeding",
          params: { attendanceDateKey: selectedDateKey },
        });
      }
    } catch (error: unknown) {
      reportHandledError("attendance.save", error);
      Alert.alert(
        "Unable to save attendance",
        getUserFriendlyErrorMessage(
          error,
          "Attendance could not be saved. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraftAndLeave = async () => {
    if (!user?.id || !editable || isEditing) return;
    await saveDraft({
      userId: user.id,
      recordType: "attendance",
      dateKey: selectedDateKey,
      payload: {
        dateKey: selectedDateKey,
        records: toDraftRecords(attendance),
      },
    });
    await refreshPendingCount();
    Alert.alert(
      "Draft saved on this device",
      "You can return to this draft later on this device.",
    );
    router.replace("/(teacher)");
  };

  const canEditFinalized =
    isReadOnly &&
    !data?.attendanceRecord?.localPending &&
    selectedDateKey === getManilaDateKey();

  return {
    router,
    backRoute,
    children,
    loading:
      isLoading || Boolean(data && hydratedDataUpdatedAt !== dataUpdatedAt),
    attendance,
    searchQuery,
    setSearchQuery,
    selectedDateKey,
    setSelectedDateKey,
    selectedDateLabel,
    isReadOnly,
    isEditing,
    editable,
    canEditFinalized,
    filteredChildren,
    stats,
    changeSummary,
    filter,
    setFilter,
    setStatus,
    excuseEditor,
    setExcuseEditor,
    confirmExcused,
    startEditing: () => {
      if (isOffline) {
        Alert.alert(
          "Internet required",
          "Connect to the internet to edit finalized attendance.",
        );
        return;
      }
      setOriginalAttendance(attendance);
      setIsEditing(true);
    },
    cancelEditing: () => {
      setAttendance(originalAttendance);
      setIsEditing(false);
    },
    handleSubmit,
    saveDraftAndLeave,
    isOffline,
    isSubmitting,
    showSuccessFeedback,
    successWasEdit,
    dismissSuccessFeedback: () => setShowSuccessFeedback(false),
  };
};

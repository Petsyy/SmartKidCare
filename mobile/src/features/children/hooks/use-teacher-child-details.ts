import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChildById, type Child } from "@/src/api/parent.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import { useAuth } from "@/src/hooks/use-auth";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useOffline } from "@/src/offline/offline-context";
import { onlineWithOfflineFallback, readOfflineRecordForDate, readOfflineResource } from "@/src/offline/offline-read";
import { getManilaDateKey } from "@/src/utils/manila-date";

interface CareRecord {
  child: string | { _id: string };
  status: string;
}

interface DailyCareRecord {
  records?: CareRecord[];
  foodServed?: string;
}

export function useTeacherChildDetails(childId: string | null) {
  const queryClient = useQueryClient();
  const { authState, isAuthenticated, user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const canReadChildDetails =
    isAuthenticated || authState === "offlineAuthenticated";
  const mustUseOfflineData =
    authState === "offlineAuthenticated" ||
    !isConnected ||
    !isInternetReachable;

  const query = useQuery({
    queryKey: mobileQueryKeys.teacherChildDetails(childId),
    networkMode: "always",
    enabled:
      canReadChildDetails && Boolean(user?.id) && Boolean(childId),
    queryFn: async () => {
      if (!childId) throw new Error("Missing required data");
      if (!user?.id) throw new Error("Please sign in again.");

      const readCachedOrOfflineChild = async () => {
        const overview = queryClient.getQueryData<{ children?: Child[] }>(
          mobileQueryKeys.teacherChildrenOverview(),
        );
        const activeChild = overview?.children?.find((entry) => entry._id === childId);
        if (activeChild) return activeChild;

        const archived = queryClient.getQueryData<Child[]>(
          mobileQueryKeys.teacherArchivedChildren(),
        );
        const archivedChild = archived?.find((entry) => entry._id === childId);
        if (archivedChild) return archivedChild;

        const children = await readOfflineResource<Child>(user.id, "children");
        const offlineChild = children.find((entry) => entry._id === childId);
        if (!offlineChild) {
          throw new Error(
            mustUseOfflineData
              ? "This child is not available in the offline data on this device."
              : "Child details could not be loaded. Please try again.",
          );
        }
        return offlineChild;
      };

      const today = getManilaDateKey();
      const [child, attendanceRecord, feedingRecord] = await Promise.all([
        onlineWithOfflineFallback(mustUseOfflineData, () => getChildById(childId), readCachedOrOfflineChild),
        onlineWithOfflineFallback(mustUseOfflineData, () => getTodayAttendance(), () => readOfflineRecordForDate<DailyCareRecord & { date: string }>(user.id, "attendance", today)),
        onlineWithOfflineFallback(mustUseOfflineData, () => getTodayFeeding(), () => readOfflineRecordForDate<DailyCareRecord & { date: string }>(user.id, "feeding", today)),
      ]);
      return { child, attendanceRecord, feedingRecord };
    },
  });

  const child = query.data?.child ?? null;
  const attendanceRecord = query.data?.attendanceRecord ?? null;
  const feedingRecord = query.data?.feedingRecord ?? null;
  const status = useMemo(() => {
    if (!child) return { attendance: "Not Recorded", feeding: "Not Recorded" };
    const idOf = (record: CareRecord) =>
      typeof record.child === "string" ? record.child : record.child._id;
    const attendance = attendanceRecord?.records?.find((record: CareRecord) => idOf(record) === child._id);
    const feeding = feedingRecord?.records?.find((record: CareRecord) => idOf(record) === child._id);
    return {
      attendance: attendance ? (attendance.status === "present" ? "Present" : "Absent") : "Not Recorded",
      feeding: feeding ? (feeding.status === "completed" ? "Completed" : "Missed") : "Not Recorded",
    };
  }, [attendanceRecord, child, feedingRecord]);

  return {
    child,
    attendanceRecord,
    feedingRecord,
    status,
    fullName: child ? [child.firstName, child.middleName, child.lastName].filter(Boolean).join(" ") : "",
    isInactive: child?.status === "Inactive",
    isOffline: mustUseOfflineData,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

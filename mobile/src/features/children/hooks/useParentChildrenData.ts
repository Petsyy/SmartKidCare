import { useCallback, useMemo, useState } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";

/**
 * Derives a specific child's record status from a batch record.
 * Returns the status string (e.g. "present", "absent", "completed", "missed")
 * or null if no matching entry exists for this child.
 */
function getChildRecordStatus(
  record: any,
  childId: string | undefined,
): string | null {
  if (!childId || !Array.isArray(record?.records)) return null;

  const entry = record.records.find((item: any) => {
    const id = typeof item?.child === "object" ? item.child?._id : item?.child;
    return String(id) === String(childId);
  });

  return typeof entry?.status === "string" ? entry.status : null;
}

export const useParentChildrenData = () => {
  const { isAuthenticated } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: mobileQueryKeys.parentChildrenDashboard(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [children, todayAttendance, todayFeeding] = await Promise.all([
        getMyChildren(),
        getTodayAttendance().catch(() => null),
        getTodayFeeding().catch(() => null),
      ]);
      return { children, todayAttendance, todayFeeding };
    },
  });

  const children: Child[] = useMemo(
    () => data?.children ?? [],
    [data?.children],
  );
  const todayAttendanceRecord = data?.todayAttendance ?? null;
  const todayFeedingRecord = data?.todayFeeding ?? null;

  const loadScreenData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      void loadScreenData();
    }, [loadScreenData]),
  );

  const onRefresh = () => {
    void loadScreenData();
  };

  const selectedChild = useMemo(() => {
    if (!children.length) return null;
    if (!selectedChildId) return children[0];
    return (
      children.find((child) => child._id === selectedChildId) ?? children[0]
    );
  }, [children, selectedChildId]);

  const attendanceStatus = useMemo(
    () => getChildRecordStatus(todayAttendanceRecord, selectedChild?._id),
    [todayAttendanceRecord, selectedChild?._id],
  );

  const feedingStatus = useMemo(
    () => getChildRecordStatus(todayFeedingRecord, selectedChild?._id),
    [todayFeedingRecord, selectedChild?._id],
  );

  const scrollBottomPadding = Math.max(100, tabBarHeight + 24);

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    todayAttendanceRecord,
    todayFeedingRecord,
    attendanceStatus,
    feedingStatus,
    loading: isLoading,
    refreshing: isRefetching,
    error: error instanceof Error ? error.message : null,
    loadScreenData,
    onRefresh,
    scrollBottomPadding,
  };
};

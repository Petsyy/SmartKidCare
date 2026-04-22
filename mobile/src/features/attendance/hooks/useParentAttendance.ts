import { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import { getAttendanceHistory } from "@/src/api/records.api";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export type AttendanceStatus = "Present" | "Absent" | null;

export interface AttendanceDay {
  day: number;
  status: AttendanceStatus;
  teacherName?: string;
  recordedAt?: string;
}

export const useParentAttendance = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const monthKey = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;
  const {
    data: childrenData = [],
    isLoading: isLoadingChildren,
    refetch: refetchChildren,
  } = useQuery({
    queryKey: mobileQueryKeys.parentAttendanceChildren(token),
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      return getMyChildren(token);
    },
  });

  useEffect(() => {
    setChildren(childrenData);
    setSelectedChild((currentSelectedChild) => {
      if (!childrenData.length) return null;
      if (currentSelectedChild) {
        const matchedChild = childrenData.find(
          (child) => child._id === currentSelectedChild._id,
        );
        if (matchedChild) return matchedChild;
      }
      return childrenData[0];
    });
  }, [childrenData]);

  useFocusEffect(
    useCallback(() => {
      void refetchChildren();
    }, [refetchChildren]),
  );
  const { data: attendanceData = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: mobileQueryKeys.parentAttendanceHistory(
      token,
      selectedChild?._id ?? null,
      monthKey,
    ),
    enabled: Boolean(token && selectedChild),
    queryFn: async () => {
      if (!token || !selectedChild) return [];
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const history = await getAttendanceHistory(
        token,
        startDate.toISOString(),
        endDate.toISOString(),
      );
      const byDay = new Map<number, AttendanceDay>();
      history.forEach((record: any) => {
        const recordDate = new Date(record.date);
        const entry = record.records?.find(
          (r: any) => (r.child?._id || r.child) === selectedChild._id,
        );
        if (entry) {
          const status: AttendanceStatus =
            entry.status === "present" ? "Present" : "Absent";
          const teacher = record.teacher;
          const teacherName = teacher
            ? `${teacher.firstName} ${teacher.lastName}`
            : "Not available";
          const recordedAt = record.updatedAt || record.createdAt || record.date || null;
          byDay.set(recordDate.getDate(), {
            day: recordDate.getDate(),
            status,
            teacherName,
            recordedAt,
          });
        }
      });
      return Array.from(byDay.values());
    },
  });
  const loading = isLoadingChildren || isLoadingAttendance;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getMonthName = (date: Date) =>
    date.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Manila",
    });

  const getStatusForDay = (day: number): AttendanceStatus => {
    const dayData = attendanceData.find((d) => d.day === day);
    return dayData ? dayData.status : null;
  };

  const getDetailsForDay = (day: number) =>
    attendanceData.find((d) => d.day === day) || null;

  const getSelectedDateLabel = () => {
    if (!selectedDay) return "";
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    const month = date.toLocaleDateString("en-PH", { month: "long", timeZone: "Asia/Manila" });
    const day = date.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" });
    const year = date.toLocaleDateString("en-PH", { year: "numeric", timeZone: "Asia/Manila" });
    return `${month}, ${day} ${year}`;
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "Present":
        return "bg-green-500";
      case "Absent":
        return "bg-red-500";
      default:
        return "bg-transparent";
    }
  };

  const calculateMonthlySummary = () => {
    const summary = { present: 0, absent: 0 };
    attendanceData.forEach((day) => {
      if (day.status === "Present") summary.present++;
      else if (day.status === "Absent") summary.absent++;
    });
    return summary;
  };

  const calculateAttendanceRate = () => {
    const summary = calculateMonthlySummary();
    const total = summary.present + summary.absent;
    if (total === 0) return 0;
    return Math.round((summary.present / total) * 100);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (direction === "prev") newDate.setMonth(newDate.getMonth() - 1);
      else newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  return {
    router,
    insets,
    children,
    selectedChild,
    setSelectedChild,
    loading,
    showChildDropdown,
    setShowChildDropdown,
    currentDate,
    attendanceData,
    selectedDay,
    setSelectedDay,
    showDayModal,
    setShowDayModal,
    getDaysInMonth,
    getMonthName,
    getStatusForDay,
    getDetailsForDay,
    getSelectedDateLabel,
    getStatusColor,
    calculateMonthlySummary,
    calculateAttendanceRate,
    navigateMonth,
  };
};

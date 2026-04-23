import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import { getFeedingHistory } from "@/src/api/records.api";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export type FeedingStatus = "Completed" | "Missed" | null;

export interface FeedingDay {
  day: number;
  status: FeedingStatus;
  teacherName?: string;
  recordedAt?: string;
  foodServed?: string;
}

export const useParentFeeding = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const monthKey = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const { data: childrenData = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: mobileQueryKeys.parentFeedingChildren(),
    enabled: isAuthenticated,
    queryFn: () => getMyChildren(),
  });

  useEffect(() => {
    setChildren(childrenData);
    setSelectedChild((current) => {
      if (!childrenData.length) return null;
      if (current) {
        const matched = childrenData.find((child) => child._id === current._id);
        if (matched) return matched;
      }
      return childrenData[0];
    });
  }, [childrenData]);

  const { data: feedingData = [], isLoading: isLoadingFeeding } = useQuery({
    queryKey: mobileQueryKeys.parentFeedingHistory(selectedChild?._id ?? null, monthKey),
    enabled: isAuthenticated && Boolean(selectedChild),
    queryFn: async () => {
      if (!selectedChild) return [];
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const history = await getFeedingHistory(startDate.toISOString(), endDate.toISOString());
      const byDay = new Map<number, FeedingDay>();
      history.forEach((record: any) => {
        const recordDate = new Date(record.date);
        const entry = record.records?.find(
          (r: any) => (r.child?._id || r.child) === selectedChild._id,
        );
        if (entry) {
          const status: FeedingStatus = entry.status === "completed" ? "Completed" : "Missed";
          const teacher = record.teacher;
          const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Not available";
          const recordedAt = record.updatedAt || record.createdAt || record.date || null;
          const foodServed = record.foodServed || "Not specified";
          byDay.set(recordDate.getDate(), { day: recordDate.getDate(), status, teacherName, recordedAt, foodServed });
        }
      });
      return Array.from(byDay.values());
    },
  });
  const loading = isLoadingChildren || isLoadingFeeding;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getMonthName = (date: Date) =>
    date.toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "Asia/Manila" });

  const getStatusForDay = (day: number): FeedingStatus => {
    const dayData = feedingData.find((d) => d.day === day);
    return dayData ? dayData.status : null;
  };

  const getDetailsForDay = (day: number) => feedingData.find((d) => d.day === day) || null;

  const getStatusColor = (status: FeedingStatus) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "Missed": return "bg-red-500";
      default: return "bg-transparent";
    }
  };

  const calculateMonthlySummary = () => {
    const summary = { completed: 0, missed: 0 };
    feedingData.forEach((day) => {
      if (day.status === "Completed") summary.completed++;
      else if (day.status === "Missed") summary.missed++;
    });
    return summary;
  };

  const calculateFeedingRate = () => {
    const summary = calculateMonthlySummary();
    const total = summary.completed + summary.missed;
    if (total === 0) return 0;
    return Math.round((summary.completed / total) * 100);
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
    router, insets, children, selectedChild, setSelectedChild, loading,
    showChildDropdown, setShowChildDropdown, currentDate, feedingData,
    selectedDay, setSelectedDay, showDayModal, setShowDayModal,
    getDaysInMonth, getMonthName, getStatusForDay, getDetailsForDay,
    getStatusColor, calculateMonthlySummary, calculateFeedingRate, navigateMonth,
  };
};

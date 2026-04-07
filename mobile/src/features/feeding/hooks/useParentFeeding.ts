import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import { getFeedingHistory } from "@/src/api/records.api";

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
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1));
  const [feedingData, setFeedingData] = useState<FeedingDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        if (!token) throw new Error("No authentication token");
        const data = await getMyChildren(token);
        setChildren(data);
        if (data.length > 0) setSelectedChild(data[0]);
      } catch (err: any) {
        console.error("Failed to load children:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadChildren();
  }, [token]);

  useEffect(() => {
    const loadFeeding = async () => {
      if (!token || !selectedChild) {
        setFeedingData([]);
        return;
      }

      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const history = await getFeedingHistory(
          token,
          startDate.toISOString(),
          endDate.toISOString(),
        );

        const byDay = new Map<number, FeedingDay>();

        history.forEach((record: any) => {
          const recordDate = new Date(record.date);
          const entry = record.records?.find((r: any) => (r.child?._id || r.child) === selectedChild._id);

          if (entry) {
            const status: FeedingStatus = entry.status === "completed" ? "Completed" : "Missed";
            const teacher = record.teacher;
            const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Not available";
            const recordedAt = record.updatedAt || record.createdAt || record.date || null;
            const foodServed = record.foodServed || "Not specified";

            byDay.set(recordDate.getDate(), {
              day: recordDate.getDate(),
              status,
              teacherName,
              recordedAt,
              foodServed,
            });
          }
        });

        setFeedingData(Array.from(byDay.values()));
      } catch (err) {
        console.error("Failed to load feeding history:", err);
        setFeedingData([]);
      }
    };

    void loadFeeding();
  }, [token, selectedChild, currentDate]);

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

  const getStatusForDay = (day: number): FeedingStatus => {
    const dayData = feedingData.find((d) => d.day === day);
    return dayData ? dayData.status : null;
  };

  const getDetailsForDay = (day: number) => feedingData.find((d) => d.day === day) || null;

  const getStatusColor = (status: FeedingStatus) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "Missed":
        return "bg-red-500";
      default:
        return "bg-transparent";
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
    router,
    insets,
    children,
    selectedChild,
    setSelectedChild,
    loading,
    showChildDropdown,
    setShowChildDropdown,
    currentDate,
    feedingData,
    selectedDay,
    setSelectedDay,
    showDayModal,
    setShowDayModal,
    getDaysInMonth,
    getMonthName,
    getStatusForDay,
    getDetailsForDay,
    getStatusColor,
    calculateMonthlySummary,
    calculateFeedingRate,
    navigateMonth,
  };
};

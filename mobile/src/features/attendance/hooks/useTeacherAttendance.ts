import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import { submitAttendance, getTodayAttendance } from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";
import { formatManilaDateLabel, getManilaDateKey } from "@/src/utils/manila-date";

export const useTeacherAttendance = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);

  const selectedDateKey = useMemo(() => getManilaDateKey(), []);
  const selectedDateLabel = useMemo(
    () => formatManilaDateLabel(selectedDateKey),
    [selectedDateKey],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          const [childrenData, todayRecord] = await Promise.all([
            getChildren(token),
            getTodayAttendance(token),
          ]);

          setChildren(childrenData);

          if (todayRecord) {
            setIsReadOnly(true);
            const existingAttendance: Record<string, boolean> = {};
            todayRecord.records.forEach((record: any) => {
              existingAttendance[record.child._id || record.child] =
                record.status === "present";
            });
            setAttendance(existingAttendance);
          } else {
            const initialAttendance: Record<string, boolean> = {};
            childrenData.forEach((child) => {
              initialAttendance[child._id] = false;
            });
            setAttendance(initialAttendance);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

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

      await submitAttendance(token, {
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
    loading,
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

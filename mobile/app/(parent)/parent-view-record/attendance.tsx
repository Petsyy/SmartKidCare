import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyChildren, Child } from "@/src/api/parent.api";
import { getAttendanceHistory } from "@/src/api/records.api";

type AttendanceStatus = "Present" | "Absent" | null;

interface AttendanceDay {
  day: number;
  status: AttendanceStatus;
  teacherName?: string;
  recordedAt?: string;
}

export default function ViewAttendanceDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1)); // February 2026
  const [attendanceData, setAttendanceData] = useState<AttendanceDay[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const authToken = await AsyncStorage.getItem("token");
      if (!authToken) throw new Error("No authentication token");
      setToken(authToken);

      const data = await getMyChildren(authToken);
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (err: any) {
      console.error("Failed to load children:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAttendance = async () => {
      if (!token || !selectedChild) {
        setAttendanceData([]);
        return;
      }

      try {
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
            const recordedAt =
              record.updatedAt || record.createdAt || record.date || null;
            byDay.set(recordDate.getDate(), {
              day: recordDate.getDate(),
              status,
              teacherName,
              recordedAt,
            });
          }
        });

        const days: AttendanceDay[] = Array.from(byDay.values());

        setAttendanceData(days);
      } catch (err) {
        console.error("Failed to load attendance history:", err);
        setAttendanceData([]);
      }
    };

    loadAttendance();
  }, [token, selectedChild, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getStatusForDay = (day: number): AttendanceStatus => {
    const dayData = attendanceData.find((d) => d.day === day);
    return dayData ? dayData.status : null;
  };

  const getDetailsForDay = (day: number) =>
    attendanceData.find((d) => d.day === day) || null;

  const getSelectedDateLabel = () => {
    if (!selectedDay) return "";
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
    );
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
    const summary = {
      present: 0,
      absent: 0,
    };

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
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Day names header
    const dayHeaders = dayNames.map((name, index) => (
      <View key={`header-${index}`} className="w-[14.28%] items-center py-2">
        <Text className="text-sm font-semibold text-gray-600">{name}</Text>
      </View>
    ));

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} className="w-[14.28%] p-2" />);
    }

    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth();

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const status = getStatusForDay(day);
      const isToday = isCurrentMonth && day === today.getDate();

      days.push(
        <Pressable
          key={`day-${day}`}
          className="w-[14.28%] p-2"
          onPress={() => {
            setSelectedDay(day);
            setShowDayModal(true);
          }}
        >
          <View
            className={`items-center justify-center h-10 rounded-full ${isToday ? "border-2 border-teal-500" : ""}`}
          >
            <Text
              className={`text-base ${isToday ? "font-bold text-teal-600" : "text-gray-700"}`}
            >
              {day}
            </Text>
            {status && (
              <View
                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getStatusColor(status)}`}
              />
            )}
          </View>
        </Pressable>,
      );
    }

    return (
      <View>
        <View className="flex-row flex-wrap">{dayHeaders}</View>
        <View className="flex-row flex-wrap">{days}</View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const summary = calculateMonthlySummary();
  const attendanceRate = calculateAttendanceRate();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.push("/(parent)")}
            className="mr-4"
          >
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">
              Attendance
            </Text>
            <Text className="text-lg text-teal-100 mt-1">
              View your child's daily attendance
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Attendance Subheader */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-700">
            Attendance
          </Text>
          <Text className="text-base text-gray-500 mt-1">
            View your child's daily attendance records
          </Text>
        </View>

        {/* Child Selector */}
        <View className="mb-6">
          <Pressable
            onPress={() => setShowChildDropdown(!showChildDropdown)}
            className="bg-white rounded-xl p-4 flex-row items-center justify-between border border-gray-200"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-teal-500 items-center justify-center mr-3">
                <Text className="text-white font-semibold text-lg">
                  {selectedChild?.firstName.charAt(0)}
                </Text>
              </View>
              <Text className="text-lg font-medium text-gray-800">
                {selectedChild
                  ? `${selectedChild.firstName} ${selectedChild.lastName}`
                  : "Select Child"}
              </Text>
            </View>
            <ChevronDown size={20} color="#6B7280" />
          </Pressable>

          {/* Dropdown Menu */}
          {showChildDropdown && children.length > 1 && (
            <View className="bg-white rounded-xl mt-2 border border-gray-200 overflow-hidden">
              {children.map((child, index) => (
                <Pressable
                  key={child._id}
                  onPress={() => {
                    setSelectedChild(child);
                    setShowChildDropdown(false);
                  }}
                  className={`p-4 flex-row items-center ${index !== children.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <View className="w-10 h-10 rounded-full bg-teal-500 items-center justify-center mr-3">
                    <Text className="text-white font-semibold text-lg">
                      {child.firstName.charAt(0)}
                    </Text>
                  </View>
                  <Text className="text-lg text-gray-800">
                    {child.firstName} {child.lastName}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Calendar Card */}
        <View className="bg-white rounded-xl p-5 mb-6 border border-gray-200">
          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigateMonth("prev")} className="p-2">
              <ChevronLeft size={20} color="#6B7280" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-800">
              {getMonthName(currentDate)}
            </Text>
            <Pressable onPress={() => navigateMonth("next")} className="p-2">
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Calendar Grid */}
          {renderCalendar()}

          {/* Legend */}
          <View className="mt-6 pt-4 border-t border-gray-100">
            <View className="flex-row flex-wrap">
              <View className="flex-row items-center mr-4 mb-2">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-sm text-gray-600">Present</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                <Text className="text-sm text-gray-600">Absent</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Summary */}
        <View className="bg-white rounded-xl p-5 mb-6 border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Summary
          </Text>
          <View className="flex-row flex-wrap">
            <View className="w-[48%] mr-[4%] mb-4">
              <View className="bg-green-50 rounded-lg p-4 items-center">
                <Text className="text-3xl font-bold text-green-700">
                  {summary.present}
                </Text>
                <Text className="text-base text-green-600 mt-1">Present</Text>
              </View>
            </View>
            <View className="w-[48%]">
              <View className="bg-red-50 rounded-lg p-4 items-center">
                <Text className="text-3xl font-bold text-red-700">
                  {summary.absent}
                </Text>
                <Text className="text-base text-red-600 mt-1">Absent</Text>
              </View>
            </View>
          </View>

          {/* Overall Attendance Rate */}
          <View className="mt-6 pt-4 border-t border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-medium text-gray-700">
                Overall Attendance Rate
              </Text>
              <Text className="text-2xl font-bold text-green-600">
                {attendanceRate}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${attendanceRate}%` }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={showDayModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        {(() => {
          const dayDetails = selectedDay ? getDetailsForDay(selectedDay) : null;
          const recordedLabel = dayDetails?.recordedAt
            ? new Date(dayDetails.recordedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "Not available";

          return (
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full rounded-2xl bg-white p-6">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  Attendance Details
                </Text>
              </View>
              <Pressable
                onPress={() => setShowDayModal(false)}
                className="px-3 py-2"
              >
                <Text className="text-teal-600 font-semibold">Close</Text>
              </Pressable>
            </View>

            <View className="bg-gray-50 rounded-2xl p-4">
              <Text className="text-sm text-gray-500 mb-2">Status</Text>
              <Text className="text-xl font-bold text-gray-900">
                {selectedDay ? getStatusForDay(selectedDay) || "Not recorded" : "Not recorded"}
              </Text>

              <View className="mt-4">
                <Text className="text-sm text-gray-500 mb-1">Teacher</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {dayDetails?.teacherName || "Not available"}
                </Text>
              </View>

              <View className="mt-3">
                <Text className="text-sm text-gray-500 mb-1">Recorded</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {recordedLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>
          );
        })()}
      </Modal>
    </View>
  );
}

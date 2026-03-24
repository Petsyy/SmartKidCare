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
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  X,
  Calendar,
  User,
} from "lucide-react-native";
import { getMyChildren, Child } from "@/src/api/parent.api";
import { getFeedingHistory } from "@/src/api/records.api";
import { useAuth } from "@/src/hooks/use-auth";

type FeedingStatus = "Completed" | "Missed" | null;

interface FeedingDay {
  day: number;
  status: FeedingStatus;
  teacherName?: string;
  recordedAt?: string;
  foodServed?: string;
}

export default function ViewFeedingDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1)); // February 2026
  const [feedingData, setFeedingData] = useState<FeedingDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  useEffect(() => {
    loadChildren();
  }, [token]);

  const loadChildren = async () => {
    try {
      if (!token) throw new Error("No authentication token");

      const data = await getMyChildren(token);
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
          const entry = record.records?.find(
            (r: any) => (r.child?._id || r.child) === selectedChild._id,
          );

          if (entry) {
            const status: FeedingStatus =
              entry.status === "completed" ? "Completed" : "Missed";
            const teacher = record.teacher;
            const teacherName = teacher
              ? `${teacher.firstName} ${teacher.lastName}`
              : "Not available";
            const recordedAt =
              record.updatedAt || record.createdAt || record.date || null;
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

    loadFeeding();
  }, [token, selectedChild, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Manila",
    });
  };

  const getStatusForDay = (day: number): FeedingStatus => {
    const dayData = feedingData.find((d) => d.day === day);
    return dayData ? dayData.status : null;
  };

  const getDetailsForDay = (day: number) =>
    feedingData.find((d) => d.day === day) || null;

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
    const summary = {
      completed: 0,
      missed: 0,
    };

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
          className="w-[14.28%] p-1"
          onPress={() => {
            setSelectedDay(day);
            setShowDayModal(true);
          }}
          android_ripple={{ color: "#14B8A6", radius: 24 }}
        >
          <View
            className={`items-center justify-center h-12 rounded-xl mx-0.5 ${
              status === "Completed"
                ? "bg-green-100"
                : status === "Missed"
                  ? "bg-red-100"
                  : isToday
                    ? "bg-teal-50"
                    : ""
            } ${isToday ? "border-2 border-teal-500" : ""}`}
            style={{
              shadowColor: status ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: status ? 0.1 : 0,
              shadowRadius: 2,
              elevation: status ? 2 : 0,
            }}
          >
            <Text
              className={`text-base font-semibold ${
                isToday
                  ? "text-teal-600"
                  : status === "Completed"
                    ? "text-green-700"
                    : status === "Missed"
                      ? "text-red-700"
                      : "text-gray-500"
              }`}
            >
              {day}
            </Text>
            {status && (
              <View
                className={`w-2 h-2 rounded-full mt-1 ${
                  status === "Completed" ? "bg-green-600" : "bg-red-600"
                }`}
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
  const feedingRate = calculateFeedingRate();

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
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3"
          >
            <ChevronLeft size={22} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">Feeding</Text>
            <Text className="text-lg text-teal-100 mt-1">
              View your child's daily feeding
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
        {/* Child Selector */}
        <View className="mb-6">
          <Pressable
            onPress={() => setShowChildDropdown(!showChildDropdown)}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-gray-200"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-11 h-11 rounded-2xl bg-teal-500 items-center justify-center mr-3">
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
            <View className="bg-white rounded-2xl mt-2 border border-gray-200 overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {children.map((child, index) => (
                <Pressable
                  key={child._id}
                  onPress={() => {
                    setSelectedChild(child);
                    setShowChildDropdown(false);
                  }}
                  className={`p-4 flex-row items-center ${index !== children.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <View className="w-11 h-11 rounded-2xl bg-teal-500 items-center justify-center mr-3">
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
        <View
          className="bg-white rounded-3xl p-5 mb-6 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
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
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Legend
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
                <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                <Text className="text-sm font-medium text-gray-700">
                  Completed
                </Text>
              </View>
              <View className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg">
                <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <Text className="text-sm font-medium text-gray-700">
                  Missed
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Summary */}
        <View
          className="bg-white rounded-3xl p-5 mb-6 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Summary
          </Text>
          <View className="flex-row flex-wrap">
            <View className="w-[48%] mr-[4%] mb-4">
              <View className="bg-green-50 rounded-2xl p-4 items-start border-l-4 border-green-500"
                style={{
                  shadowColor: "#059669",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <Text className="text-3xl font-bold text-green-700">
                  {summary.completed}
                </Text>
                <View className="flex-row items-center mt-2">
                  <UtensilsCrossed size={16} color="#059669" />
                  <Text className="text-base text-green-600 ml-2">
                    Completed
                  </Text>
                </View>
              </View>
            </View>
            <View className="w-[48%]">
              <View className="bg-red-50 rounded-2xl p-4 items-start border-l-4 border-red-500"
                style={{
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <Text className="text-3xl font-bold text-red-700">
                  {summary.missed}
                </Text>
                <View className="flex-row items-center mt-2">
                  <X size={16} color="#DC2626" />
                  <Text className="text-base text-red-600 ml-2">Missed</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Overall Feeding Completion Rate */}
          <View className="mt-6 pt-4 border-t border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-medium text-gray-700">
                Overall Feeding Rate
              </Text>
              <Text className="text-2xl font-bold text-green-600">
                {feedingRate}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${feedingRate}%` }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={showDayModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        {(() => {
          const dayDetails = selectedDay ? getDetailsForDay(selectedDay) : null;
          const recordedLabel = dayDetails?.recordedAt
            ? new Date(dayDetails.recordedAt).toLocaleString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZone: "Asia/Manila",
              })
            : "Not available";

          const getSelectedDateLabel = () => {
            if (!selectedDay) return "";
            const date = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              selectedDay,
            );
            return date.toLocaleDateString("en-PH", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "Asia/Manila",
            });
          };

          return (
            <View className="flex-1 bg-black/60 items-center justify-center px-6">
              <View
                className="w-full rounded-3xl bg-white p-6"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <View className="flex-row items-center justify-between mb-5">
                  <View className="flex-row items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 mr-3">
                      <UtensilsCrossed size={24} color="#14B8A6" />
                    </View>
                    <View>
                      <Text className="text-xl font-bold text-gray-900">
                        {getSelectedDateLabel()}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-0.5">
                        Feeding Details
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-100">
                  <View
                    className="bg-white rounded-xl p-4 mb-3"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      Status
                    </Text>
                    <View
                      className={`inline-flex px-4 py-2 rounded-full ${
                        dayDetails?.status === "Completed"
                          ? "bg-green-100"
                          : dayDetails?.status === "Missed"
                            ? "bg-red-100"
                            : "bg-gray-100"
                      }`}
                      style={{ alignSelf: "flex-start" }}
                    >
                      <Text
                        className={`text-base font-bold ${
                          dayDetails?.status === "Completed"
                            ? "text-green-700"
                            : dayDetails?.status === "Missed"
                              ? "text-red-700"
                              : "text-gray-700"
                        }`}
                      >
                        {selectedDay
                          ? getStatusForDay(selectedDay) || "Not recorded"
                          : "Not recorded"}
                      </Text>
                    </View>
                  </View>

                  <View
                    className="bg-white rounded-xl p-4 mb-3"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      Food Served
                    </Text>
                    <Text className="text-base font-bold text-gray-800">
                      {dayDetails?.foodServed || "Not specified"}
                    </Text>
                  </View>

                  <View
                    className="bg-white rounded-xl p-4 mb-3"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      Teacher
                    </Text>
                    <Text className="text-base font-bold text-gray-800">
                      {dayDetails?.teacherName || "Not available"}
                    </Text>
                  </View>

                  <View
                    className="bg-white rounded-xl p-4"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      Recorded At
                    </Text>
                    <Text className="text-base font-bold text-gray-800">
                      {recordedLabel}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setShowDayModal(false)}
                  className="mt-5 bg-teal-600 rounded-xl py-4 active:opacity-80"
                  style={{
                    shadowColor: "#14B8A6",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className="text-white font-bold text-center text-base">
                    Close
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })()}
      </Modal>
    </View>
  );
}

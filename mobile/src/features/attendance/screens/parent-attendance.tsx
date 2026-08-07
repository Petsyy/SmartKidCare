import { Pressable, Text, View } from "react-native";
import { UserCheck, UserX, Calendar } from "lucide-react-native";
import { MonthlyRecordViewer } from "@/src/components/ui/monthly-record-viewer";
import { useParentAttendance } from "@/src/features/attendance/hooks";

type AttendanceDay = {
  day: number;
  status: "Present" | "Absent" | null;
  teacherName?: string;
  recordedAt?: string;
};

export default function ViewAttendanceDetails() {
  const {
    router,
    insets,
    children,
    selectedChild,
    setSelectedChild,
    loading,
    showChildDropdown,
    setShowChildDropdown,
    currentDate,
    selectedDay,
    setSelectedDay,
    showDayModal,
    setShowDayModal,
    getDaysInMonth,
    getMonthName,
    getStatusForDay,
    getDetailsForDay,
    getSelectedDateLabel,
    calculateMonthlySummary,
    calculateAttendanceRate,
    navigateMonth,
  } = useParentAttendance();

  const summary = calculateMonthlySummary();
  const attendanceRate = calculateAttendanceRate();

  return (
    <MonthlyRecordViewer<AttendanceDay>
      title="Attendance"
      subtitle="View your child's daily attendance"
      loading={loading}
      insetsTop={insets.top}
      onBack={() => router.push("/(parent)")}
      children={children}
      selectedChild={selectedChild}
      onSelectChild={setSelectedChild}
      showChildDropdown={showChildDropdown}
      setShowChildDropdown={setShowChildDropdown}
      currentDate={currentDate}
      getDaysInMonth={getDaysInMonth}
      getMonthName={getMonthName}
      getStatusForDay={getStatusForDay}
      getDetailsForDay={getDetailsForDay}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      showDayModal={showDayModal}
      setShowDayModal={setShowDayModal}
      getSelectedDateLabel={() => getSelectedDateLabel()}
      getStatusStyles={(status, isToday) => ({
        cellClass:
          status === "Present"
            ? "bg-green-100"
            : status === "Absent"
              ? "bg-red-100"
              : isToday
                ? "bg-teal-50"
                : "",
        textClass: isToday
          ? "text-teal-600"
          : status === "Present"
            ? "text-green-700"
            : status === "Absent"
              ? "text-red-700"
              : "text-gray-500",
        dotClass: status === "Present" ? "bg-green-600" : "bg-red-600",
      })}
      onNavigateMonth={navigateMonth}
      renderLegend={() => (
        <>
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Legend
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
              <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <Text className="text-sm font-medium text-gray-700">Present</Text>
            </View>
            <View className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg">
              <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              <Text className="text-sm font-medium text-gray-700">Absent</Text>
            </View>
          </View>
        </>
      )}
      renderSummary={() => (
        <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-100 shadow-md">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Summary
          </Text>
          <View className="flex-row flex-wrap">
            <View className="w-[48%] mr-[4%] mb-4">
              <View className="bg-green-50 rounded-2xl p-4 items-start border-l-4 border-green-500 shadow-sm">
                <Text className="text-3xl font-bold text-green-700">
                  {summary.present}
                </Text>
                <View className="flex-row items-center mt-2">
                  <UserCheck size={16} color="#059669" />
                  <Text className="text-base text-green-600 ml-2">Present</Text>
                </View>
              </View>
            </View>
            <View className="w-[48%]">
              <View className="bg-red-50 rounded-2xl p-4 items-start border-l-4 border-red-500 shadow-sm">
                <Text className="text-3xl font-bold text-red-700">
                  {summary.absent}
                </Text>
                <View className="flex-row items-center mt-2">
                  <UserX size={16} color="#DC2626" />
                  <Text className="text-base text-red-600 ml-2">Absent</Text>
                </View>
              </View>
            </View>
          </View>

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
      )}
      renderModalContent={(
        dayDetails,
        currentSelectedDay,
        selectedDateLabel,
        closeModal,
      ) => {
        const recordedLabel = dayDetails?.recordedAt
          ? (() => {
              const recordedDate = new Date(dayDetails.recordedAt as string);
              const month = recordedDate.toLocaleDateString("en-PH", {
                month: "long",
                timeZone: "Asia/Manila",
              });
              const day = recordedDate.toLocaleDateString("en-PH", {
                day: "numeric",
                timeZone: "Asia/Manila",
              });
              const year = recordedDate.toLocaleDateString("en-PH", {
                year: "numeric",
                timeZone: "Asia/Manila",
              });
              const time = recordedDate.toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
              });
              return `${month}, ${day} ${year}, ${time}`;
            })()
          : "Not available";

        return (
          <View className="flex-1 bg-black/60 items-center justify-center px-6">
            <View className="w-full rounded-3xl bg-white p-6 shadow-xl">
              <View className="mb-5">
                <View className="flex-row items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 mr-3">
                    <Calendar size={24} color="#14B8A6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">
                      {selectedDateLabel}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      Attendance Details
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-100">
                <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                  <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    Status
                  </Text>
                  <View
                    className={`px-4 py-2 rounded-full self-start ${dayDetails?.status === "Present" ? "bg-green-100" : dayDetails?.status === "Absent" ? "bg-red-100" : "bg-gray-100"}`}
                  >
                    <Text
                      className={`text-base font-bold ${dayDetails?.status === "Present" ? "text-green-700" : dayDetails?.status === "Absent" ? "text-red-700" : "text-gray-700"}`}
                    >
                      {currentSelectedDay
                        ? getStatusForDay(currentSelectedDay) || "Not recorded"
                        : "Not recorded"}
                    </Text>
                  </View>

                  <Text className="text-xs font-semibold text-gray-500 mb-2 mt-4 uppercase tracking-wider">
                    Teacher
                  </Text>
                  <Text className="text-base font-bold text-gray-800">
                    {dayDetails?.teacherName || "Not available"}
                  </Text>
                </View>

                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    Recorded At
                  </Text>
                  <Text className="text-base font-bold text-gray-800">
                    {recordedLabel}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={closeModal}
                className="mt-5 bg-teal-600 rounded-xl py-4 active:opacity-80 shadow-md"
              >
                <Text className="text-white font-bold text-center text-base">
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

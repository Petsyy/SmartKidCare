import { Pressable, Text, View } from "react-native";
import { UserCheck, UserX, Calendar, Clock, User, X, CheckCircle2, AlertCircle } from "lucide-react-native";
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
    jumpToToday,
  } = useParentAttendance();

  const summary = calculateMonthlySummary();
  const attendanceRate = calculateAttendanceRate();
  const totalLoggedDays = summary.present + summary.absent;

  return (
    <MonthlyRecordViewer<AttendanceDay>
      title="Attendance Record"
      subtitle="Track your child's daily school attendance"
      loading={loading}
      insetsTop={insets.top}
      onBack={() => router.push("/(parent)")}
      childOptions={children}
      selectedChild={selectedChild}
      onSelectChild={setSelectedChild}
      showChildDropdown={showChildDropdown}
      setShowChildDropdown={setShowChildDropdown}
      currentDate={currentDate}
      onJumpToToday={jumpToToday}
      getDaysInMonth={getDaysInMonth}
      getMonthName={getMonthName}
      getStatusForDay={getStatusForDay}
      getDetailsForDay={getDetailsForDay}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      showDayModal={showDayModal}
      setShowDayModal={setShowDayModal}
      getSelectedDateLabel={() => getSelectedDateLabel()}
      getStatusStyles={(status, isToday) => {
        if (status === "Present") {
          return {
            cellClass: "bg-emerald-50 border-emerald-200/80 shadow-sm shadow-emerald-500/10",
            textClass: "text-emerald-900",
            dotClass: "bg-emerald-500",
          };
        }
        if (status === "Absent") {
          return {
            cellClass: "bg-rose-50 border-rose-200/80 shadow-sm shadow-rose-500/10",
            textClass: "text-rose-900",
            dotClass: "bg-rose-500",
          };
        }
        if (isToday) {
          return {
            cellClass: "bg-teal-50/70 border-teal-300",
            textClass: "text-teal-700",
            dotClass: undefined,
          };
        }
        return {
          cellClass: "bg-transparent border-gray-100",
          textClass: "text-gray-700",
          dotClass: undefined,
        };
      }}
      onNavigateMonth={navigateMonth}
      renderLegend={() => (
        <View>
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
            Status Legend
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="flex-row items-center bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-xs font-bold text-emerald-800">
                Present
              </Text>
            </View>
            <View className="flex-row items-center bg-rose-50 border border-rose-200/60 px-3 py-1.5 rounded-full">
              <View className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2" />
              <Text className="text-xs font-bold text-rose-800">Absent</Text>
            </View>
            <View className="flex-row items-center bg-teal-50 border border-teal-200/60 px-3 py-1.5 rounded-full">
              <View className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-2" />
              <Text className="text-xs font-bold text-teal-800">Today</Text>
            </View>
          </View>
        </View>
      )}
      renderSummary={() => (
        <View
          className="bg-white rounded-3xl p-5 mb-6 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Monthly Summary
          </Text>

          <View className="flex-row gap-3 mb-5">
            <View className="flex-1 bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-8 h-8 rounded-xl bg-emerald-100 items-center justify-center">
                  <UserCheck size={18} color="#059669" />
                </View>
                <Text className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  Present
                </Text>
              </View>
              <Text className="text-3xl font-extrabold text-emerald-900">
                {summary.present}
              </Text>
              <Text className="text-xs text-emerald-700 mt-1 font-medium">
                Days present
              </Text>
            </View>

            <View className="flex-1 bg-rose-50/80 rounded-2xl p-4 border border-rose-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-8 h-8 rounded-xl bg-rose-100 items-center justify-center">
                  <UserX size={18} color="#E11D48" />
                </View>
                <Text className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                  Absent
                </Text>
              </View>
              <Text className="text-3xl font-extrabold text-rose-900">
                {summary.absent}
              </Text>
              <Text className="text-xs text-rose-700 mt-1 font-medium">
                Days absent
              </Text>
            </View>
          </View>

          {/* Rate Progress Bar */}
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-gray-800">
                Overall Attendance Rate
              </Text>
              <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <Text className="text-sm font-extrabold text-emerald-800">
                  {attendanceRate}%
                </Text>
              </View>
            </View>
            <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
              <View
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${attendanceRate}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500">
              {totalLoggedDays > 0
                ? `${summary.present} out of ${totalLoggedDays} recorded school days present.`
                : "No attendance entries recorded for this month."}
            </Text>
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

        const hasDetails = dayDetails && dayDetails.status !== null;

        return (
          <View className="flex-1 bg-black/50 justify-end">
            <Pressable
              className="flex-1"
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Dismiss sheet"
            />
            <View
              className="w-full rounded-t-3xl bg-white px-6 pt-3 pb-8"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              {/* Bottom Sheet Drag Handle */}
              <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />

              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center flex-1">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 mr-3">
                    <Calendar size={22} color="#14B8A6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-extrabold text-gray-900">
                      {selectedDateLabel || "Date Details"}
                    </Text>
                    <Text className="text-xs font-medium text-gray-500 mt-0.5">
                      Daily Attendance Detail
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={closeModal}
                  className="w-9 h-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              {hasDetails ? (
                <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  {/* Status row */}
                  <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </Text>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        dayDetails?.status === "Present"
                          ? "bg-emerald-100"
                          : "bg-rose-100"
                      }`}
                    >
                      <Text
                        className={`text-sm font-extrabold ${
                          dayDetails?.status === "Present"
                            ? "text-emerald-800"
                            : "text-rose-800"
                        }`}
                      >
                        {dayDetails?.status}
                      </Text>
                    </View>
                  </View>

                  {/* Teacher */}
                  <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm">
                    <View className="flex-row items-center mb-1.5">
                      <User size={14} color="#6B7280" className="mr-1.5" />
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Recorded Teacher
                      </Text>
                    </View>
                    <Text className="text-base font-bold text-gray-900">
                      {dayDetails?.teacherName || "Not available"}
                    </Text>
                  </View>

                  {/* Recorded At */}
                  <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <View className="flex-row items-center mb-1.5">
                      <Clock size={14} color="#6B7280" className="mr-1.5" />
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Recorded Timestamp
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-gray-800">
                      {recordedLabel}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="bg-gray-50 rounded-2xl p-6 items-center justify-center border border-dashed border-gray-300 my-2">
                  <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-3">
                    <Calendar size={24} color="#9CA3AF" />
                  </View>
                  <Text className="text-base font-bold text-gray-800 text-center">
                    No Attendance Record Logged
                  </Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">
                    No attendance entry was registered for {selectedDateLabel || "this date"}.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={closeModal}
                className="mt-5 bg-teal-600 rounded-2xl py-3.5 active:opacity-90 shadow-md shadow-teal-500/20"
                accessibilityRole="button"
                accessibilityLabel="Close window"
              >
                <Text className="text-white font-bold text-center text-base">
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

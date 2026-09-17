import { Pressable, Text, View } from "react-native";
import { UtensilsCrossed, X, Clock, User, Calendar, CheckCircle2, AlertCircle } from "lucide-react-native";
import { MonthlyRecordViewer } from "@/src/components/ui/monthly-record-viewer";
import { useParentFeeding } from "@/src/features/feeding/hooks";

type FeedingDay = {
  day: number;
  status: "Completed" | "Missed" | null;
  teacherName?: string;
  recordedAt?: string;
  foodServed?: string;
};

export default function ViewFeedingDetails() {
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
    calculateMonthlySummary,
    calculateFeedingRate,
    navigateMonth,
    jumpToToday,
  } = useParentFeeding();

  const summary = calculateMonthlySummary();
  const feedingRate = calculateFeedingRate();
  const totalLoggedDays = summary.completed + summary.missed;

  return (
    <MonthlyRecordViewer<FeedingDay>
      title="Feeding History"
      subtitle="Track your child's daily meals & feeding logs"
      loading={loading}
      insetsTop={insets.top}
      onBack={() => router.push("/(parent)")}
      children={children}
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
      getSelectedDateLabel={(day) => {
        if (!day) return "";
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          day,
        );
        return date.toLocaleDateString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Manila",
        });
      }}
      getStatusStyles={(status, isToday) => {
        if (status === "Completed") {
          return {
            cellClass: "bg-emerald-50 border-emerald-200/80 shadow-sm shadow-emerald-500/10",
            textClass: "text-emerald-900",
            dotClass: "bg-emerald-500",
          };
        }
        if (status === "Missed") {
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
                Completed
              </Text>
            </View>
            <View className="flex-row items-center bg-rose-50 border border-rose-200/60 px-3 py-1.5 rounded-full">
              <View className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2" />
              <Text className="text-xs font-bold text-rose-800">Missed</Text>
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
                  <CheckCircle2 size={18} color="#059669" />
                </View>
                <Text className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  Completed
                </Text>
              </View>
              <Text className="text-3xl font-extrabold text-emerald-900">
                {summary.completed}
              </Text>
              <Text className="text-xs text-emerald-700 mt-1 font-medium">
                Meals served
              </Text>
            </View>

            <View className="flex-1 bg-rose-50/80 rounded-2xl p-4 border border-rose-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-8 h-8 rounded-xl bg-rose-100 items-center justify-center">
                  <AlertCircle size={18} color="#E11D48" />
                </View>
                <Text className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                  Missed
                </Text>
              </View>
              <Text className="text-3xl font-extrabold text-rose-900">
                {summary.missed}
              </Text>
              <Text className="text-xs text-rose-700 mt-1 font-medium">
                Meals missed
              </Text>
            </View>
          </View>

          {/* Rate Progress Bar */}
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-gray-800">
                Overall Feeding Rate
              </Text>
              <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <Text className="text-sm font-extrabold text-emerald-800">
                  {feedingRate}%
                </Text>
              </View>
            </View>
            <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
              <View
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${feedingRate}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500">
              {totalLoggedDays > 0
                ? `${summary.completed} out of ${totalLoggedDays} logged meal records completed.`
                : "No feeding entries recorded for this month."}
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
          ? new Date(dayDetails.recordedAt).toLocaleString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
            })
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
                    <UtensilsCrossed size={22} color="#14B8A6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-extrabold text-gray-900">
                      {selectedDateLabel}
                    </Text>
                    <Text className="text-xs font-medium text-gray-500 mt-0.5">
                      Daily Feeding Detail
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
                        dayDetails?.status === "Completed"
                          ? "bg-emerald-100"
                          : "bg-rose-100"
                      }`}
                    >
                      <Text
                        className={`text-sm font-extrabold ${
                          dayDetails?.status === "Completed"
                            ? "text-emerald-800"
                            : "text-rose-800"
                        }`}
                      >
                        {dayDetails?.status}
                      </Text>
                    </View>
                  </View>

                  {/* Food Served */}
                  <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm">
                    <View className="flex-row items-center mb-1.5">
                      <UtensilsCrossed size={14} color="#6B7280" className="mr-1.5" />
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Food Served
                      </Text>
                    </View>
                    <Text className="text-base font-bold text-gray-900">
                      {dayDetails?.foodServed || "Not specified"}
                    </Text>
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
                    No Feeding Record Logged
                  </Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">
                    No meal record was registered for {selectedDateLabel}.
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

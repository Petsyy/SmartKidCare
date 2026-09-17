import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from "lucide-react-native";
import type { Child } from "@/src/api/parent.api";
import { BRAND_HEADER_GRADIENT } from "./screen-header.constants";
import { ParentLoadingState } from "./parent-loading-state";

type DayStatusStyles = {
  cellClass: string;
  textClass: string;
  dotClass?: string;
};

type MonthlyRecordViewerProps<TDetails> = {
  title: string;
  subtitle: string;
  loading: boolean;
  insetsTop: number;
  onBack: () => void;
  children: Child[];
  selectedChild: Child | null;
  onSelectChild: (child: Child) => void;
  showChildDropdown: boolean;
  setShowChildDropdown: (value: boolean) => void;
  currentDate: Date;
  onJumpToToday?: () => void;
  getDaysInMonth: (date: Date) => {
    daysInMonth: number;
    firstDayOfMonth: number;
  };
  getMonthName: (date: Date) => string;
  getStatusForDay: (day: number) => string | null;
  getDetailsForDay: (day: number) => TDetails | null;
  selectedDay: number | null;
  setSelectedDay: (day: number) => void;
  showDayModal: boolean;
  setShowDayModal: (value: boolean) => void;
  getSelectedDateLabel: (day: number | null) => string;
  getStatusStyles: (status: string | null, isToday: boolean) => DayStatusStyles;
  onNavigateMonth: (direction: "prev" | "next") => void;
  renderLegend: () => ReactNode;
  renderSummary: () => ReactNode;
  renderModalContent: (
    details: TDetails | null,
    selectedDay: number | null,
    selectedDateLabel: string,
    closeModal: () => void,
  ) => ReactNode;
};

export function MonthlyRecordViewer<TDetails>({
  title,
  subtitle,
  loading,
  insetsTop,
  onBack,
  children,
  selectedChild,
  onSelectChild,
  showChildDropdown,
  setShowChildDropdown,
  currentDate,
  onJumpToToday,
  getDaysInMonth,
  getMonthName,
  getStatusForDay,
  getDetailsForDay,
  selectedDay,
  setSelectedDay,
  showDayModal,
  setShowDayModal,
  getSelectedDateLabel,
  getStatusStyles,
  onNavigateMonth,
  renderLegend,
  renderSummary,
  renderModalContent,
}: MonthlyRecordViewerProps<TDetails>) {
  const renderCalendar = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days: ReactNode[] = [];

    const dayHeaders = dayNames.map((name, index) => {
      const isWeekend = index === 0 || index === 6;
      return (
        <View key={`header-${index}`} className="w-[14.28%] items-center py-2">
          <Text
            className={`text-xs font-bold tracking-wider ${
              isWeekend ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {name}
          </Text>
        </View>
      );
    });

    for (let index = 0; index < firstDayOfMonth; index++) {
      days.push(<View key={`empty-${index}`} className="w-[14.28%] p-1" />);
    }

    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const status = getStatusForDay(day);
      const isToday = isCurrentMonth && day === today.getDate();
      const styles = getStatusStyles(status, isToday);

      days.push(
        <Pressable
          key={`day-${day}`}
          className="w-[14.28%] p-1"
          onPress={() => {
            setSelectedDay(day);
            setShowDayModal(true);
          }}
        >
          <View
            className={`items-center justify-center h-12 rounded-2xl border ${
              isToday ? "border-2 border-teal-500 bg-teal-50/60 shadow-sm" : styles.cellClass
            }`}
            style={{
              shadowColor: status || isToday ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: status || isToday ? 0.08 : 0,
              shadowRadius: 3,
              elevation: status || isToday ? 2 : 0,
            }}
          >
            <Text className={`text-base font-bold ${styles.textClass}`}>
              {day}
            </Text>
            {status && styles.dotClass ? (
              <View
                className={`w-2 h-2 rounded-full mt-0.5 ${styles.dotClass}`}
              />
            ) : null}
          </View>
        </Pressable>,
      );
    }

    return (
      <View>
        <View className="flex-row flex-wrap mb-1">{dayHeaders}</View>
        <View className="flex-row flex-wrap">{days}</View>
      </View>
    );
  };

  const headerSection = (
    <LinearGradient
      colors={BRAND_HEADER_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insetsTop + 12 }}
      className="px-5 pb-5"
    >
      <View className="flex-row items-center">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3 active:bg-white/30"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color="white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-3xl font-extrabold text-white">{title}</Text>
          <Text className="text-sm font-medium text-teal-100 mt-0.5">{subtitle}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        {headerSection}
        <ParentLoadingState
          title={`Loading ${title.toLowerCase()}`}
          message={`Getting ${title.toLowerCase()} records ready.`}
        />
      </View>
    );
  }

  const selectedDateLabel = getSelectedDateLabel(selectedDay);
  const dayDetails = selectedDay ? getDetailsForDay(selectedDay) : null;
  const isCurrentMonthActive =
    new Date().getFullYear() === currentDate.getFullYear() &&
    new Date().getMonth() === currentDate.getMonth();

  return (
    <View className="flex-1 bg-gray-50">
      {headerSection}

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Child Selection Bar */}
        <View className="mb-5">
          {children.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row py-1"
            >
              {children.map((child) => {
                const isSelected = selectedChild?._id === child._id;
                return (
                  <Pressable
                    key={child._id}
                    onPress={() => onSelectChild(child)}
                    className={`flex-row items-center px-4 py-2.5 rounded-2xl mr-3 border transition-all ${
                      isSelected
                        ? "bg-teal-600 border-teal-600 shadow-md shadow-teal-500/20"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center mr-2.5 ${
                        isSelected ? "bg-white/20" : "bg-teal-50"
                      }`}
                    >
                      <Text
                        className={`font-bold text-xs ${
                          isSelected ? "text-white" : "text-teal-700"
                        }`}
                      >
                        {child.firstName.charAt(0)}
                      </Text>
                    </View>
                    <Text
                      className={`font-bold text-sm ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {child.firstName} {child.lastName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-100 shadow-sm">
              <LinearGradient
                colors={BRAND_HEADER_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-11 h-11 rounded-2xl overflow-hidden items-center justify-center mr-3.5 shadow-sm shadow-teal-600/30"
              >
                <Text className="text-white font-extrabold text-lg">
                  {selectedChild?.firstName.charAt(0) || "C"}
                </Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Child Profile
                </Text>
                <Text className="text-base font-bold text-gray-900 mt-0.5">
                  {selectedChild
                    ? `${selectedChild.firstName} ${selectedChild.lastName}`
                    : "Child Record"}
                </Text>
              </View>
              {showChildDropdown && children.length > 1 ? (
                <ChevronDown size={20} color="#6B7280" />
              ) : null}
            </View>
          )}
        </View>

        {/* Calendar Card */}
        <View
          className="bg-white rounded-3xl p-5 mb-5 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          {/* Month Header Navigation */}
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-teal-50 items-center justify-center">
                <CalendarIcon size={18} color="#14B8A6" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {getMonthName(currentDate)}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {onJumpToToday && !isCurrentMonthActive ? (
                <Pressable
                  onPress={onJumpToToday}
                  className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full active:bg-teal-100 mr-1"
                >
                  <Text className="text-xs font-bold text-teal-700">
                    Today
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => onNavigateMonth("prev")}
                className="w-9 h-9 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200"
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <ChevronLeft size={18} color="#4B5563" />
              </Pressable>

              <Pressable
                onPress={() => onNavigateMonth("next")}
                className="w-9 h-9 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200"
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <ChevronRight size={18} color="#4B5563" />
              </Pressable>
            </View>
          </View>

          {renderCalendar()}

          <View className="mt-5 pt-4 border-t border-gray-100">
            {renderLegend()}
          </View>
        </View>

        {/* Summary Card */}
        {renderSummary()}
      </ScrollView>

      {/* Day Details Bottom Sheet Overlay */}
      {showDayModal ? (
        <View className="absolute inset-0 z-50">
          {renderModalContent(dayDetails, selectedDay, selectedDateLabel, () =>
            setShowDayModal(false),
          )}
        </View>
      ) : null}
    </View>
  );
}

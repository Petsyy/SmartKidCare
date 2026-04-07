import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { Child } from "@/src/api/parent.api";

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
  getDaysInMonth: (date: Date) => { daysInMonth: number; firstDayOfMonth: number };
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

    const dayHeaders = dayNames.map((name, index) => (
      <View key={`header-${index}`} className="w-[14.28%] items-center py-2">
        <Text className="text-sm font-semibold text-gray-600">{name}</Text>
      </View>
    ));

    for (let index = 0; index < firstDayOfMonth; index++) {
      days.push(<View key={`empty-${index}`} className="w-[14.28%] p-2" />);
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
          android_ripple={{ color: "#14B8A6", radius: 24 }}
        >
          <View
            className={`items-center justify-center h-12 rounded-xl mx-0.5 ${styles.cellClass}`}
            style={{
              shadowColor: status ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: status ? 0.1 : 0,
              shadowRadius: 2,
              elevation: status ? 2 : 0,
            }}
          >
            <Text className={`text-base font-semibold ${styles.textClass}`}>
              {day}
            </Text>
            {status && styles.dotClass ? (
              <View className={`w-2 h-2 rounded-full mt-1 ${styles.dotClass}`} />
            ) : null}
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

  const selectedDateLabel = getSelectedDateLabel(selectedDay);
  const dayDetails = selectedDay ? getDetailsForDay(selectedDay) : null;

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: insetsTop + 12 }} className="bg-teal-600 px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3"
          >
            <ChevronLeft size={22} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">{title}</Text>
            <Text className="text-lg text-teal-100 mt-1">{subtitle}</Text>
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

          {showChildDropdown && children.length > 1 ? (
            <View
              className="bg-white rounded-2xl mt-2 border border-gray-200 overflow-hidden"
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
                    onSelectChild(child);
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
          ) : null}
        </View>

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
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => onNavigateMonth("prev")} className="p-2">
              <ChevronLeft size={20} color="#6B7280" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-800">
              {getMonthName(currentDate)}
            </Text>
            <Pressable onPress={() => onNavigateMonth("next")} className="p-2">
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>
          </View>

          {renderCalendar()}

          <View className="mt-6 pt-4 border-t border-gray-100">
            {renderLegend()}
          </View>
        </View>

        {renderSummary()}
      </ScrollView>

      <Modal
        visible={showDayModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        {renderModalContent(
          dayDetails,
          selectedDay,
          selectedDateLabel,
          () => setShowDayModal(false),
        )}
      </Modal>
    </View>
  );
}
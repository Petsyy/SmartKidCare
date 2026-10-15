import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { AlertCircle, Calendar, CheckCircle2, Clock3 } from "lucide-react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type FeedingDateStatus =
  | "attendanceMissing"
  | "attendanceSubmitted"
  | "feedingSubmitted";

export type FeedingDateOption = {
  dateKey: string;
  label: string;
  status: FeedingDateStatus;
};

interface FeedingDatePickerProps {
  dateKey: string;
  dateLabel: string;
  dateOptions: FeedingDateOption[];
  onDateChange: (dateKey: string) => void;
}

const statusPresentation = {
  attendanceMissing: {
    label: "Attendance required",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    Icon: AlertCircle,
    color: "#B45309",
  },
  attendanceSubmitted: {
    label: "Attendance ready",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    Icon: Clock3,
    color: "#047857",
  },
  feedingSubmitted: {
    label: "Feeding recorded",
    textClass: "text-teal-700",
    bgClass: "bg-teal-50",
    borderClass: "border-teal-200",
    Icon: CheckCircle2,
    color: "#0F766E",
  },
} as const;

export function FeedingDatePicker({
  dateKey,
  dateLabel,
  dateOptions,
  onDateChange,
}: FeedingDatePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const selectedStatus =
    dateOptions.find((option) => option.dateKey === dateKey)?.status ??
    "attendanceMissing";
  const selectedPresentation = statusPresentation[selectedStatus];

  const selectDate = (nextDateKey: string) => {
    onDateChange(nextDateKey);
    setShowDatePicker(false);
  };

  return (
    <>
      <View className="px-6 pb-2 pt-4">
        <Pressable
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Feeding date: ${dateLabel}. ${selectedPresentation.label}`}
          accessibilityHint="Opens feeding dates from the last seven days with attendance and feeding status."
          className="flex-row items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3.5 active:opacity-85"
        >
          <View className="flex-1 flex-row items-center">
            <Calendar size={20} color="#C2410C" />
            <View className="ml-3 flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Feeding date
              </Text>
              <Text className="mt-0.5 text-base font-bold text-orange-950">
                {dateLabel}
              </Text>
              <Text
                className={`mt-0.5 text-sm font-semibold ${selectedPresentation.textClass}`}
              >
                {selectedPresentation.label}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-bold text-orange-700">Change</Text>
        </Pressable>
      </View>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="rounded-t-3xl bg-white px-6 pt-6"
            style={{
              maxHeight: windowHeight * 0.85,
              paddingBottom: Math.max(insets.bottom, 24),
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-gray-900">
                  Select feeding date
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Attendance is required before feeding can be recorded.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowDatePicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Close feeding date selection"
                className="min-h-11 justify-center px-2"
              >
                <Text className="text-base font-semibold text-gray-500">
                  Close
                </Text>
              </Pressable>
            </View>

            <ScrollView
              className="shrink"
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              showsVerticalScrollIndicator
              bounces={false}
            >
              {dateOptions.map((option) => {
                const presentation = statusPresentation[option.status];
                const StatusIcon = presentation.Icon;
                const selected = option.dateKey === dateKey;
                return (
                  <Pressable
                    key={option.dateKey}
                    onPress={() => selectDate(option.dateKey)}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label}. ${presentation.label}`}
                    accessibilityState={{ selected }}
                    className={`min-h-16 flex-row items-center rounded-2xl border px-4 py-3 ${presentation.bgClass} ${
                      selected ? "border-orange-500" : presentation.borderClass
                    }`}
                  >
                    <StatusIcon size={22} color={presentation.color} />
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-gray-900">
                        {option.label}
                      </Text>
                      <Text
                        className={`mt-0.5 text-sm font-semibold ${presentation.textClass}`}
                      >
                        {presentation.label}
                      </Text>
                    </View>
                    {selected ? (
                      <Text className="text-sm font-bold text-orange-700">
                        Selected
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

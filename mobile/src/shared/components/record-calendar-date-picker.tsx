import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import {
  getManilaDateKey,
  isValidManilaDateKey,
} from "@/src/utils/manila-date";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DatePickerTone = "emerald" | "teal" | "orange" | "sky";

const TONE_STYLES: Record<
  DatePickerTone,
  {
    borderActive: string;
    bgActive: string;
    iconColor: string;
    labelColor: string;
    dateColor: string;
    buttonBg: string;
  }
> = {
  emerald: {
    borderActive: "border-emerald-200",
    bgActive: "bg-emerald-50",
    iconColor: "#047857",
    labelColor: "text-emerald-700",
    dateColor: "text-emerald-950",
    buttonBg: "bg-emerald-600",
  },
  teal: {
    borderActive: "border-teal-200",
    bgActive: "bg-teal-50",
    iconColor: "#0F766E",
    labelColor: "text-teal-700",
    dateColor: "text-teal-950",
    buttonBg: "bg-teal-600",
  },
  orange: {
    borderActive: "border-orange-200",
    bgActive: "bg-orange-50",
    iconColor: "#C2410C",
    labelColor: "text-orange-700",
    dateColor: "text-orange-950",
    buttonBg: "bg-orange-600",
  },
  sky: {
    borderActive: "border-sky-200",
    bgActive: "bg-sky-50",
    iconColor: "#0284C7",
    labelColor: "text-sky-700",
    dateColor: "text-sky-950",
    buttonBg: "bg-sky-600",
  },
};

export interface RecordCalendarDatePickerProps {
  dateKey: string;
  dateLabel: string;
  onDateChange: (dateKey: string) => void;
  title?: string;
  modalTitle?: string;
  disabled?: boolean;
  compact?: boolean;
  tone?: DatePickerTone;
  maxPastDays?: number;
  containerClassName?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  alertTitle?: string;
  alertMessage?: (minDateKey: string, todayDateKey: string) => string;
}

export function RecordCalendarDatePicker({
  dateKey,
  dateLabel,
  onDateChange,
  title = "Date",
  modalTitle,
  disabled = false,
  compact = false,
  tone = "teal",
  maxPastDays = 7,
  containerClassName,
  accessibilityLabel,
  accessibilityHint,
  alertTitle = "Invalid Date",
  alertMessage,
}: RecordCalendarDatePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => new Date());
  const [dateBounds] = useState(() => {
    const maximumDate = new Date();
    return {
      minimumDate: new Date(maximumDate.getTime() - maxPastDays * DAY_MS),
      maximumDate,
    };
  });

  const selectedDate = new Date(`${dateKey}T12:00:00+08:00`);
  const { minimumDate, maximumDate } = dateBounds;
  const toneStyle = TONE_STYLES[tone];

  const openDatePicker = () => {
    if (disabled) return;
    setPickerDate(selectedDate);
    setShowDatePicker(true);
  };

  const applySelectedDate = (date: Date) => {
    const selectedDateKey = getManilaDateKey(date);
    const todayDateKey = getManilaDateKey();
    const minimumDateKey = getManilaDateKey(minimumDate);

    if (
      !isValidManilaDateKey(selectedDateKey) ||
      selectedDateKey < minimumDateKey ||
      selectedDateKey > todayDateKey
    ) {
      const message = alertMessage
        ? alertMessage(minimumDateKey, todayDateKey)
        : `Date must be today or within the previous ${maxPastDays} days (${minimumDateKey} to ${todayDateKey}).`;

      Alert.alert(alertTitle, message);
      return false;
    }

    onDateChange(selectedDateKey);
    return true;
  };

  const handleDateValueChange = (_event: unknown, date?: Date) => {
    if (!date) return;

    if (Platform.OS === "android") {
      setShowDatePicker(false);
      applySelectedDate(date);
      return;
    }

    setPickerDate(date);
  };

  const handleDateDismiss = () => {
    if (Platform.OS === "android") setShowDatePicker(false);
  };

  const confirmDate = () => {
    if (applySelectedDate(pickerDate)) {
      setShowDatePicker(false);
    }
  };

  const resolvedContainerClass =
    containerClassName ?? (compact ? "mb-3 mt-3" : "px-6 pb-2 pt-4");

  return (
    <>
      <View className={resolvedContainerClass}>
        <Pressable
          onPress={openDatePicker}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={
            accessibilityLabel ?? `${title}: ${dateLabel}`
          }
          accessibilityHint={
            accessibilityHint ??
            `Opens a date picker. Dates from the last ${maxPastDays} days can be selected.`
          }
          accessibilityState={{ disabled }}
          className={`flex-row items-center justify-between rounded-2xl border px-4 ${
            compact ? "min-h-16 py-2.5" : "py-3.5"
          } ${
            disabled
              ? "border-gray-200 bg-gray-50 opacity-60"
              : `${toneStyle.borderActive} ${toneStyle.bgActive} active:opacity-85`
          }`}
        >
          <View className="flex-row items-center">
            <Calendar
              size={20}
              color={disabled ? "#9CA3AF" : toneStyle.iconColor}
            />
            <View className="ml-3">
              <Text
                className={`text-xs font-semibold uppercase tracking-wide ${
                  disabled ? "text-gray-400" : toneStyle.labelColor
                }`}
              >
                {title}
              </Text>
              <Text
                className={`mt-0.5 text-base font-bold ${
                  disabled ? "text-gray-500" : toneStyle.dateColor
                }`}
              >
                {dateLabel}
              </Text>
            </View>
          </View>
          <Text
            className={`text-sm font-bold ${
              disabled ? "text-gray-400" : toneStyle.labelColor
            }`}
          >
            {disabled ? "Locked" : "Change"}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showDatePicker && Platform.OS === "ios"}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">
                {modalTitle ?? `Select ${title.toLowerCase()}`}
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel date selection"
              >
                <Text className="text-base font-semibold text-gray-500">
                  Cancel
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onValueChange={handleDateValueChange}
              onDismiss={handleDateDismiss}
              themeVariant="light"
            />
            <Pressable
              onPress={confirmDate}
              accessibilityRole="button"
              accessibilityLabel={`Use selected ${title.toLowerCase()}`}
              className={`mt-4 min-h-14 items-center justify-center rounded-2xl ${toneStyle.buttonBg} px-5 py-4 active:opacity-85`}
            >
              <Text className="text-lg font-bold text-white">
                Use This Date
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showDatePicker && Platform.OS === "android" ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={handleDateValueChange}
          onDismiss={handleDateDismiss}
        />
      ) : null}
    </>
  );
}


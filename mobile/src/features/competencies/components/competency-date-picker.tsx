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
} from "../../../utils/manila-date";

const DAY_MS = 24 * 60 * 60 * 1000;

type CompetencyDatePickerProps = {
  dateKey: string;
  dateLabel: string;
  disabled?: boolean;
  onDateChange: (dateKey: string) => void;
};

export function CompetencyDatePicker({
  dateKey,
  dateLabel,
  disabled = false,
  onDateChange,
}: CompetencyDatePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => new Date());
  const [dateBounds] = useState(() => {
    const maximumDate = new Date();
    return {
      minimumDate: new Date(maximumDate.getTime() - 30 * DAY_MS),
      maximumDate,
    };
  });
  const selectedDate = new Date(`${dateKey}T12:00:00+08:00`);
  const { minimumDate, maximumDate } = dateBounds;

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
      Alert.alert(
        "Invalid Evaluation Date",
        `Competency evaluations can only be backdated up to 30 days (from ${minimumDateKey} to ${todayDateKey}).`,
      );
      return false;
    }

    onDateChange(selectedDateKey);
    return true;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "dismissed" || !date) return;

    if (Platform.OS === "android") {
      applySelectedDate(date);
      return;
    }

    setPickerDate(date);
  };

  const confirmDate = () => {
    if (applySelectedDate(pickerDate)) {
      setShowDatePicker(false);
    }
  };

  return (
    <>
      <View className="mb-4">
        <Pressable
          onPress={openDatePicker}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Evaluation date: ${dateLabel}`}
          accessibilityHint="Opens a date picker. Past dates can be selected."
          className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
            disabled
              ? "border-gray-200 bg-gray-50"
              : "border-teal-200 bg-teal-50 active:opacity-85"
          }`}
        >
          <View className="flex-row items-center">
            <Calendar size={20} color={disabled ? "#9CA3AF" : "#0F766E"} />
            <View className="ml-3">
              <Text
                className={`text-xs font-semibold uppercase tracking-wide ${
                  disabled ? "text-gray-400" : "text-teal-700"
                }`}
              >
                Evaluation Date
              </Text>
              <Text
                className={`mt-0.5 text-base font-bold ${
                  disabled ? "text-gray-500" : "text-teal-950"
                }`}
              >
                {dateLabel}
              </Text>
            </View>
          </View>
          {!disabled && (
            <Text className="text-sm font-bold text-teal-700">Change</Text>
          )}
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
                Select evaluation date
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
              onChange={handleDateChange}
              themeVariant="light"
            />
            <Pressable
              onPress={confirmDate}
              accessibilityRole="button"
              accessibilityLabel="Use selected evaluation date"
              className="mt-4 min-h-14 items-center justify-center rounded-2xl bg-teal-600 px-5 py-4 active:opacity-85"
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
          onChange={handleDateChange}
        />
      ) : null}
    </>
  );
}

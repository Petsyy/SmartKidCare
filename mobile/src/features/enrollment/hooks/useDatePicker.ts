import { useState, useMemo } from "react";
import { Alert, Platform } from "react-native";
import { formatYmd, parseYmd, displayDate } from "@/src/features/enrollment/utils";
import type { DateFieldKey } from "@/src/features/enrollment/types";

type DatePickerNativeModule = typeof import("@react-native-community/datetimepicker");

const getNativeDatePickerModule = (): DatePickerNativeModule | null => {
  try {
    return require("@react-native-community/datetimepicker") as DatePickerNativeModule;
  } catch {
    return null;
  }
};

export const useDatePicker = (
  dateOfBirth: string,
  enrollmentDate: string,
  minDateOfBirth: Date,
  maxDateOfBirth: Date,
  onDateChange: (field: DateFieldKey, date: string) => void
) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<DateFieldKey | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [pickerInput, setPickerInput] = useState("");
  const [pickerMode, setPickerMode] = useState<"native" | "manual">("manual");

  const nativeDatePicker = useMemo(() => getNativeDatePickerModule(), []);
  const NativeDateTimePicker = nativeDatePicker?.default;
  const NativeDateTimePickerAndroid = nativeDatePicker?.DateTimePickerAndroid;

  const closePicker = () => {
    setPickerVisible(false);
    setPickerField(null);
  };

  const validatePickedDate = (field: DateFieldKey, pickedDate: Date): string | null => {
    if (field !== "dateOfBirth") return null;

    const normalizedPickedDate = formatYmd(pickedDate);
    const minAllowedDate = formatYmd(minDateOfBirth);
    const maxAllowedDate = formatYmd(maxDateOfBirth);

    if (normalizedPickedDate < minAllowedDate || normalizedPickedDate > maxAllowedDate) {
      return `Date of birth must be between ${displayDate(minAllowedDate)} and ${displayDate(maxAllowedDate)}.`;
    }

    return null;
  };

  const openDatePicker = (field: DateFieldKey) => {
    const currentValue = field === "dateOfBirth" ? dateOfBirth : enrollmentDate;
    const fallbackDate = field === "dateOfBirth" ? maxDateOfBirth : new Date();
    const initialDate = parseYmd(currentValue) || fallbackDate;

    if (Platform.OS === "android" && NativeDateTimePickerAndroid) {
      NativeDateTimePickerAndroid.open({
        value: initialDate,
        mode: "date",
        minimumDate: field === "dateOfBirth" ? minDateOfBirth : undefined,
        maximumDate: field === "dateOfBirth" ? maxDateOfBirth : undefined,
        onChange: (event: any, selectedDate?: Date) => {
          if (event.type !== "set" || !selectedDate) return;
          const validationError = validatePickedDate(field, selectedDate);
          if (validationError) {
            Alert.alert("Validation", validationError);
            return;
          }
          onDateChange(field, formatYmd(selectedDate));
        },
      });
      return;
    }

    setPickerField(field);
    setPickerDate(initialDate);
    setPickerInput(formatYmd(initialDate));
    setPickerMode(Platform.OS === "ios" && NativeDateTimePicker ? "native" : "manual");
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    if (!pickerField) return;

    if (pickerMode === "native" && Platform.OS === "ios") {
      const validationError = validatePickedDate(pickerField, pickerDate);
      if (validationError) {
        Alert.alert("Validation", validationError);
        return;
      }

      onDateChange(pickerField, formatYmd(pickerDate));
      closePicker();
      return;
    }

    const parsedInput = parseYmd(pickerInput.trim());
    if (!parsedInput) {
      Alert.alert("Invalid Date", "Use YYYY-MM-DD format (example: 2021-09-15).");
      return;
    }

    const validationError = validatePickedDate(pickerField, parsedInput);
    if (validationError) {
      Alert.alert("Validation", validationError);
      return;
    }

    onDateChange(pickerField, formatYmd(parsedInput));
    closePicker();
  };

  return {
    pickerVisible,
    setPickerVisible,
    pickerField,
    pickerDate,
    setPickerDate,
    pickerInput,
    setPickerInput,
    pickerMode,
    NativeDateTimePicker,
    NativeDateTimePickerAndroid,
    openDatePicker,
    closePicker,
    confirmPicker,
    minDateOfBirth,
    maxDateOfBirth,
  };
};

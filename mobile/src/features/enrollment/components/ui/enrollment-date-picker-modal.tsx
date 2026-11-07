import { Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import {
  displayDate,
  formatYmd,
} from "@/src/features/enrollment/utils/enrollment-utils";
import type { useDatePicker } from "@/src/features/enrollment/hooks/useDatePicker";

interface EnrollmentDatePickerModalProps {
  datePicker: ReturnType<typeof useDatePicker>;
}

export function EnrollmentDatePickerModal({
  datePicker,
}: EnrollmentDatePickerModalProps) {
  if (!datePicker.pickerVisible || !datePicker.pickerField) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="slide"
      visible={datePicker.pickerVisible}
      onRequestClose={datePicker.closePicker}
    >
      <View className="flex-1 justify-end bg-black/30">
        <View className="rounded-t-3xl bg-white px-4 pb-6 pt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable
              onPress={datePicker.closePicker}
              accessibilityRole="button"
              accessibilityLabel="Cancel date selection"
            >
              <Text className="text-lg font-semibold text-gray-600">Cancel</Text>
            </Pressable>
            <Text className="text-base font-semibold text-gray-700">
              {datePicker.pickerField === "dateOfBirth"
                ? "Select Date of Birth"
                : "Select Enrollment Date"}
            </Text>
            <Pressable
              onPress={datePicker.confirmPicker}
              accessibilityRole="button"
              accessibilityLabel="Confirm date selection"
            >
              <Text className="text-lg font-bold text-teal-600">Done</Text>
            </Pressable>
          </View>

          {datePicker.pickerMode === "native" &&
          Platform.OS === "ios" &&
          datePicker.NativeDateTimePicker ? (
            <datePicker.NativeDateTimePicker
              value={datePicker.pickerDate}
              mode="date"
              display="spinner"
              minimumDate={
                datePicker.pickerField === "dateOfBirth"
                  ? datePicker.minDateOfBirth
                  : undefined
              }
              maximumDate={
                datePicker.pickerField === "dateOfBirth"
                  ? datePicker.maxDateOfBirth
                  : undefined
              }
              onValueChange={(_, selectedDate) => {
                datePicker.setPickerDate(selectedDate);
              }}
            />
          ) : (
            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-500">
                Enter date as YYYY-MM-DD
              </Text>
              <TextInput
                value={datePicker.pickerInput}
                onChangeText={(value) => {
                  datePicker.setPickerInput(
                    value.replace(/[^0-9-]/g, "").slice(0, 10),
                  );
                }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
              />
              {datePicker.pickerField === "dateOfBirth" ? (
                <Text className="mt-2 text-xs text-gray-500">
                  Allowed range:{" "}
                  {displayDate(formatYmd(datePicker.minDateOfBirth))} to{" "}
                  {displayDate(formatYmd(datePicker.maxDateOfBirth))}
                </Text>
              ) : (
                <Text className="mt-2 text-xs text-gray-500">
                  Example: {formatYmd(new Date())}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}


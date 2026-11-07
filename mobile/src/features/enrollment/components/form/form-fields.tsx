import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CalendarDays,
} from "lucide-react-native";
import {
  displayDate,
  parseYmd,
} from "@/src/features/enrollment/utils/enrollment-utils";
import { type InputProps, INPUT_PLACEHOLDER } from "../types/enrollment-types";

export { SelectField, type SelectOption } from "./select-field";
export {
  DocumentUploadField,
  type DocumentUploadFieldProps,
} from "./document-upload-field";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  containerStyle,
  maxLength,
  editable = true,
  computed = false,
  labelHint,
  error,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const readOnly = editable === false || computed;

  const inputVariantClasses = readOnly
    ? "border-[#99F6E4] bg-[#F0FDFA] text-[#134E4A]"
    : error
      ? "border-red-500 bg-red-50 text-[#111827]"
      : focused
        ? "border-[#0D9488] bg-[#F0FDFA] text-[#111827]"
        : "border-[#E5E7EB] bg-[#FFFFFF] text-[#111827]";

  const isRequired = label.endsWith(" *");
  const bareLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <View className="mb-4" style={containerStyle}>
      <View className="mb-2 flex-row flex-wrap items-start justify-between gap-1.5">
        <View className="flex-1">
          <Text className="text-[13px] font-bold uppercase tracking-[0.6px] text-[#374151]">
            {bareLabel}
            {isRequired ? (
              <Text className="font-bold text-[#EF4444]"> *</Text>
            ) : null}
          </Text>
          {labelHint ? (
            <Text className="mt-0.5 text-[11px] leading-[15px] text-[#9CA3AF]">
              {labelHint}
            </Text>
          ) : null}
        </View>
        {computed ? (
          <View className="rounded-full border border-[#99F6E4] bg-[#CCFBF1] px-2 py-0.5">
            <Text className="text-[9px] font-extrabold tracking-[0.8px] text-[#0F766E]">
              AUTO
            </Text>
          </View>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={INPUT_PLACEHOLDER}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`min-h-[48px] rounded-xl border-[1.5px] px-[14px] py-3 text-[15px] ${inputVariantClasses}`}
      />
      {error ? (
        <Text className="mt-1.5 text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}

export function DateField({
  label,
  value,
  onPress,
  error,
}: {
  label: string;
  value: string;
  onPress: () => void;
  error?: string;
}) {
  const hasValue = Boolean(value && parseYmd(value));
  const isRequired = label.endsWith(" *");
  const bareLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <View className="mb-[18px]">
      <Text className="mb-2 text-[13px] font-bold uppercase tracking-[0.6px] text-[#374151]">
        {bareLabel}
        {isRequired ? (
          <Text className="font-bold text-[#EF4444]"> *</Text>
        ) : null}
      </Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${bareLabel}: ${hasValue ? displayDate(value) : "select date"}`}
        className={`min-h-[50px] rounded-xl border-[1.5px] px-[14px] py-[13px] ${
          error
            ? "border-red-500 bg-red-50"
            : "border-[#E5E7EB] bg-[#FFFFFF] active:border-[#0D9488] active:bg-[#F0FDFA]"
        }`}
      >
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[15px] ${
              hasValue
                ? "font-medium text-[#111827]"
                : "font-normal text-[#9CA3AF]"
            }`}
          >
            {hasValue ? displayDate(value) : "dd/mm/yyyy"}
          </Text>
          <View className="ml-2.5 items-center justify-center">
            <CalendarDays size={20} color={hasValue ? "#0F766E" : "#9CA3AF"} />
          </View>
        </View>
      </Pressable>
      {error ? (
        <Text className="mt-1.5 text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}

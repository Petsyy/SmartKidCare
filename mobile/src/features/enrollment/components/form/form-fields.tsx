import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { CalendarDays, Camera, ChevronDown, Upload } from "lucide-react-native";
import { displayDate, parseYmd } from "@/src/features/enrollment/utils";

type InputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  containerStyle?: StyleProp<ViewStyle>;
  editable?: boolean;
  computed?: boolean;
  labelHint?: string;
};

const INPUT_PLACEHOLDER = "#9CA3AF";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  containerStyle,
  editable = true,
  computed = false,
  labelHint,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const readOnly = editable === false || computed;

  const inputVariantClasses = readOnly
    ? "border-[#99F6E4] bg-[#F0FDFA] text-[#134E4A]"
    : focused
      ? "border-[#0D9488] bg-[#F0FDFA] text-[#111827]"
      : "border-[#E5E7EB] bg-[#FFFFFF] text-[#111827]";

  // Strip trailing " *" to colour it separately
  const isRequired = label.endsWith(" *");
  const bareLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <View className="mb-4" style={containerStyle}>
      <View className="flex-row flex-wrap items-start justify-between gap-1.5 mb-2">
        <View className="flex-1">
          <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-[#374151]">
            {bareLabel}
            {isRequired ? <Text className="text-[#EF4444] font-bold"> *</Text> : null}
          </Text>
          {labelHint ? (
            <Text className="mt-0.5 text-[11px] leading-[15px] text-[#9CA3AF]">{labelHint}</Text>
          ) : null}
        </View>
        {computed ? (
          <View className="rounded-full bg-[#CCFBF1] px-2 py-0.5 border border-[#99F6E4]">
            <Text className="text-[9px] font-extrabold tracking-[0.8px] text-[#0F766E]">AUTO</Text>
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`min-h-[48px] rounded-xl border-0 px-[14px] py-3 text-[15px] ${inputVariantClasses}`}
      />
    </View>
  );
}

export function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const hasValue = Boolean(value && parseYmd(value));
  const isRequired = label.endsWith(" *");
  const bareLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <View className="mb-[18px]">
      <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-[#374151] mb-2">
        {bareLabel}
        {isRequired ? <Text className="text-[#EF4444] font-bold"> *</Text> : null}
      </Text>
      <Pressable
        onPress={onPress}
        className="min-h-[50px] rounded-xl border-[1.5px] px-[14px] py-[13px] border-[#E5E7EB] bg-[#FFFFFF] active:border-[#0D9488] active:bg-[#F0FDFA]"
      >
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[15px] ${
              hasValue ? "text-[#111827] font-medium" : "text-[#9CA3AF] font-normal"
            }`}
          >
            {hasValue ? displayDate(value) : "dd/mm/yyyy"}
          </Text>
          <View className="ml-2.5 justify-center items-center">
            <CalendarDays size={20} color={hasValue ? "#0F766E" : "#9CA3AF"} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

export function SelectField({
  label,
  value,
  options,
  placeholder = "Select an option",
  onValueChange,
  disabled = false,
  loading = false,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const labelToShow = loading
    ? "Loading options..."
    : selectedOption?.label || placeholder;

  const toggleExpanded = () => {
    if (disabled || loading) return;
    setExpanded((prev) => !prev);
  };

  return (
    <View className="mb-[18px]">
      <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-[#374151] mb-2">
        {label}
      </Text>
      <Pressable
        onPress={toggleExpanded}
        className={`min-h-[50px] rounded-xl border-[1.5px] px-[14px] py-[13px] ${
          disabled
            ? "border-[#D1D5DB] bg-[#F9FAFB]"
            : "border-[#E5E7EB] bg-[#FFFFFF] active:border-[#0D9488] active:bg-[#F0FDFA]"
        }`}
      >
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[15px] ${
              selectedOption ? "text-[#111827] font-medium" : "text-[#9CA3AF] font-normal"
            }`}
          >
            {labelToShow}
          </Text>
          <View className="ml-2.5 justify-center items-center">
            <ChevronDown
              size={20}
              color={disabled ? "#9CA3AF" : "#0F766E"}
              style={expanded ? { transform: [{ rotate: "180deg" }] } : undefined}
            />
          </View>
        </View>
      </Pressable>

      {expanded && !disabled ? (
        <View className="-mt-0.5 border-[1.5px] border-[#0D9488] border-t-0 rounded-b-xl overflow-hidden bg-[#FFFFFF]">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setExpanded(false);
                }}
                className={`px-[14px] py-3 border-t border-[#F3F4F6] active:bg-[#F0FDFA] ${
                  isSelected ? "bg-[#ECFEFF]" : "bg-[#FFFFFF]"
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-[15px] ${
                    isSelected ? "text-[#0F766E] font-bold" : "text-[#111827] font-medium"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function DocumentUploadField({
  label,
  fileName,
  onUploadFile,
  onClear,
  containerStyle,
  labelStyle,
  showPhotoOption = true,
  onUploadImage,
}: {
  label: string;
  fileName: string | null;
  onUploadFile: () => void;
  onClear: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  showPhotoOption?: boolean;
  onUploadImage?: () => void;
}) {
  const hasPhotoOption = showPhotoOption && typeof onUploadImage === "function";

  const isRequired = label.endsWith(" *");
  const bareLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <View className="mb-[18px]" style={containerStyle}>
      <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-[#374151] mb-2" style={labelStyle}>
        {bareLabel}
        {isRequired ? <Text className="text-[#EF4444] font-bold"> *</Text> : null}
      </Text>

      <View className={`w-full ${hasPhotoOption ? "flex-row gap-3" : "flex-col"}`}>
        {hasPhotoOption ? (
          <Pressable
            onPress={onUploadImage}
            className="flex-1 items-center rounded-[14px] border-[1.5px] border-dashed border-[#10B981] bg-[#ECFDF5] px-[14px] py-[18px] min-h-[100px] justify-center"
          >
            <Camera size={26} color="#047857" />
            <Text
              numberOfLines={1}
              className="mt-2 text-[14px] font-bold text-[#047857]"
            >
              Select Photo
            </Text>
          </Pressable>
        ) : null}

        {fileName ? (
          <View
            className={`items-center rounded-[14px] border-[1.5px] border-dashed border-[#10B981] bg-[#ECFDF5] px-[14px] py-[18px] min-h-[100px] justify-between ${
              hasPhotoOption ? "flex-1" : "w-full"
            }`}
          >
            <Pressable
              onPress={onUploadFile}
              className="items-center justify-center w-full"
            >
              <Upload size={26} color="#047857" />
              <Text
                numberOfLines={1}
                className="mt-2 text-[14px] font-bold text-[#047857]"
              >
                Upload File
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 text-[11px] font-medium text-[#059669]"
              >
                Tap to replace file
              </Text>
            </Pressable>

            <View className="w-full mt-2.5 pt-2.5 border-t border-[#A7F3D0] flex-row items-center">
              <Text
                numberOfLines={1}
                className="flex-1 mr-2 text-[12px] font-semibold text-[#065F46]"
              >
                {fileName}
              </Text>
              <Pressable onPress={onClear} className="rounded-lg bg-[#FFFFFF] px-2.5 py-1.5">
                <Text className="text-[11px] font-bold text-[#DC2626]">Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={onUploadFile}
            className={`items-center rounded-[14px] border-[1.5px] border-dashed border-[#10B981] bg-[#ECFDF5] px-[14px] py-[18px] min-h-[100px] justify-center ${
              hasPhotoOption ? "flex-1" : "w-full"
            }`}
          >
            <Upload size={26} color="#047857" />
            <Text
              numberOfLines={1}
              className="mt-2 text-[14px] font-bold text-[#047857]"
            >
              Upload File
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}


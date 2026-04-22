import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { CalendarDays, Camera, ChevronDown, Upload } from "lucide-react-native";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";
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

  const inputVariantStyle = readOnly
    ? enrollFieldStyles.textInputReadOnly
    : focused
      ? enrollFieldStyles.textInputFocused
      : enrollFieldStyles.textInputEditable;

  // Strip trailing " *" to colour it separately
  const isRequired = label.endsWith(" *");
  const bareLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <View style={[enrollFieldStyles.inputContainer, containerStyle]}>
      <View style={fieldLayoutStyles.labelRow}>
        <View style={{ flex: 1 }}>
          <Text style={fieldLayoutStyles.labelText}>
            {bareLabel}
            {isRequired ? <Text style={fieldLayoutStyles.labelRequired}> *</Text> : null}
          </Text>
          {labelHint ? (
            <Text style={fieldLayoutStyles.labelHint}>{labelHint}</Text>
          ) : null}
        </View>
        {computed ? (
          <View style={fieldLayoutStyles.autoBadge}>
            <Text style={fieldLayoutStyles.autoBadgeText}>AUTO</Text>
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
        style={[enrollFieldStyles.textInput, inputVariantStyle]}
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
    <View style={fieldLayoutStyles.sectionContainer}>
      <Text style={fieldLayoutStyles.labelText}>
        {bareLabel}
        {isRequired ? <Text style={fieldLayoutStyles.labelRequired}> *</Text> : null}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          fieldLayoutStyles.dateFieldInput,
          pressed ? fieldLayoutStyles.dateFieldInputPressed : null,
        ]}
      >
        <View style={fieldLayoutStyles.dateFieldRow}>
          <Text
            numberOfLines={1}
            style={
              hasValue
                ? fieldLayoutStyles.dateFieldValue
                : fieldLayoutStyles.dateFieldPlaceholder
            }
          >
            {hasValue ? displayDate(value) : "dd/mm/yyyy"}
          </Text>
          <View style={fieldLayoutStyles.dateFieldIconWrap}>
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
    <View style={fieldLayoutStyles.sectionContainer}>
      <Text style={fieldLayoutStyles.labelText}>{label}</Text>
      <Pressable
        onPress={toggleExpanded}
        style={({ pressed }) => [
          fieldLayoutStyles.dateFieldInput,
          pressed && !disabled ? fieldLayoutStyles.dateFieldInputPressed : null,
          disabled ? fieldLayoutStyles.selectFieldDisabled : null,
        ]}
      >
        <View style={fieldLayoutStyles.dateFieldRow}>
          <Text
            numberOfLines={1}
            style={
              selectedOption
                ? fieldLayoutStyles.dateFieldValue
                : fieldLayoutStyles.dateFieldPlaceholder
            }
          >
            {labelToShow}
          </Text>
          <View style={fieldLayoutStyles.dateFieldIconWrap}>
            <ChevronDown
              size={20}
              color={disabled ? "#9CA3AF" : "#0F766E"}
              style={expanded ? fieldLayoutStyles.selectIconExpanded : undefined}
            />
          </View>
        </View>
      </Pressable>

      {expanded && !disabled ? (
        <View style={fieldLayoutStyles.selectFieldOptions}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setExpanded(false);
                }}
                style={({ pressed }) => [
                  fieldLayoutStyles.selectOptionRow,
                  isSelected ? fieldLayoutStyles.selectOptionRowSelected : null,
                  pressed ? fieldLayoutStyles.selectOptionRowPressed : null,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    fieldLayoutStyles.selectOptionText,
                    isSelected ? fieldLayoutStyles.selectOptionTextSelected : null,
                  ]}
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
    <View style={[fieldLayoutStyles.sectionContainer, containerStyle]}>
      <Text style={[fieldLayoutStyles.documentLabel, labelStyle]}>
        {bareLabel}
        {isRequired ? <Text style={fieldLayoutStyles.labelRequired}> *</Text> : null}
      </Text>

      <View
        style={[
          fieldLayoutStyles.uploadActionsContainer,
          hasPhotoOption
            ? fieldLayoutStyles.uploadActionsRow
            : fieldLayoutStyles.uploadActionsSingle,
        ]}
      >
        {hasPhotoOption ? (
          <Pressable
            onPress={onUploadImage}
            style={[
              fieldLayoutStyles.uploadActionButton,
              fieldLayoutStyles.uploadActionButtonRow,
            ]}
          >
            <Camera size={26} color="#047857" />
            <Text
              numberOfLines={1}
              style={fieldLayoutStyles.uploadBtnLabel}
            >
              Select Photo
            </Text>
          </Pressable>
        ) : null}

        {fileName ? (
          <View
            style={[
              fieldLayoutStyles.uploadActionButton,
              hasPhotoOption
                ? fieldLayoutStyles.uploadActionButtonRow
                : fieldLayoutStyles.uploadActionButtonSingle,
              fieldLayoutStyles.uploadActionWithFile,
            ]}
          >
            <Pressable
              onPress={onUploadFile}
              style={fieldLayoutStyles.uploadActionPressableArea}
            >
              <Upload size={26} color="#047857" />
              <Text
                numberOfLines={1}
                style={fieldLayoutStyles.uploadBtnLabel}
              >
                Upload File
              </Text>
              <Text
                numberOfLines={1}
                style={fieldLayoutStyles.uploadBtnSub}
              >
                Tap to replace file
              </Text>
            </Pressable>

            <View style={fieldLayoutStyles.uploadFileMetaRow}>
              <Text
                numberOfLines={1}
                style={fieldLayoutStyles.uploadFileName}
              >
                {fileName}
              </Text>
              <Pressable onPress={onClear} style={fieldLayoutStyles.removeButtonInline}>
                <Text style={fieldLayoutStyles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={onUploadFile}
            style={[
              fieldLayoutStyles.uploadActionButton,
              hasPhotoOption
                ? fieldLayoutStyles.uploadActionButtonRow
                : fieldLayoutStyles.uploadActionButtonSingle,
            ]}
          >
            <Upload size={26} color="#047857" />
            <Text
              numberOfLines={1}
              style={fieldLayoutStyles.uploadBtnLabel}
            >
              Upload File
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const fieldLayoutStyles = StyleSheet.create({

  labelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#374151",
  },
  labelRequired: {
    color: "#EF4444",
    fontWeight: "700",
  },
  labelHint: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: "#9CA3AF",
  },
  autoBadge: {
    borderRadius: 99,
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  autoBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#0F766E",
  },

  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  inputWrapperFocused: {
    borderColor: "#0D9488",
    backgroundColor: "#F0FDFA",
  },

  sectionContainer: {
    marginBottom: 18,
  },
  dateFieldInput: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateFieldInputPressed: {
    borderColor: "#0D9488",
    backgroundColor: "#F0FDFA",
  },
  dateFieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateFieldValue: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  dateFieldPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  dateFieldIconWrap: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  selectFieldDisabled: {
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  selectIconExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  selectFieldOptions: {
    marginTop: -2,
    borderWidth: 1.5,
    borderColor: "#0D9488",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  selectOptionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  selectOptionRowSelected: {
    backgroundColor: "#ECFEFF",
  },
  selectOptionRowPressed: {
    backgroundColor: "#F0FDFA",
  },
  selectOptionText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
  },
  selectOptionTextSelected: {
    color: "#0F766E",
    fontWeight: "700",
  },

  documentLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#374151",
    marginBottom: 8,
  },
  uploadActionsContainer: {
    width: "100%",
  },
  uploadActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  uploadActionsSingle: {
    flexDirection: "column",
  },
  uploadActionButton: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 14,
    paddingVertical: 18,
    minHeight: 100,
    justifyContent: "center",
  },
  uploadActionButtonRow: {
    flex: 1,
  },
  uploadActionButtonSingle: {
    width: "100%",
  },
  uploadActionWithFile: {
    justifyContent: "space-between",
  },
  uploadActionPressableArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
  },
  uploadBtnSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "500",
    color: "#059669",
  },
  uploadFileMetaRow: {
    width: "100%",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
  },
  uploadFileName: {
    flex: 1,
    marginRight: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
  },
  removeButtonInline: {
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
});

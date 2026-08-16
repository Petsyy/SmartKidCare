import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export type InputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad"
    | "number-pad"
    | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  containerStyle?: StyleProp<ViewStyle>;
  editable?: boolean;
  computed?: boolean;
  labelHint?: string;
  error?: string;
};

export const INPUT_PLACEHOLDER = "#9CA3AF";
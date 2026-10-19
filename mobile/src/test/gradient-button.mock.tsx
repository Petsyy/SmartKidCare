import { useEffect } from "react";
import { Pressable, Text } from "react-native";

let submit: (() => Promise<void>) | null = null;

export const getMockSubmit = () => submit;
export const resetMockSubmit = () => {
  submit = null;
};

export function MockGradientButton({
  label,
  loading,
  loadingLabel,
  onPress,
}: {
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  onPress: () => Promise<void>;
}) {
  useEffect(() => {
    submit = onPress;
    return () => {
      if (submit === onPress) submit = null;
    };
  }, [onPress]);
  const accessibleLabel = loading ? loadingLabel : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibleLabel}
      accessibilityState={{ disabled: Boolean(loading), busy: Boolean(loading) }}
      disabled={loading}
    >
      <Text>{accessibleLabel}</Text>
    </Pressable>
  );
}

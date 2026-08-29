import { ActivityIndicator, Text, View } from "react-native";

export interface ScreenLoadingStateProps {
  title: string;
  message: string;
  className?: string;
}

/**
 * Consistent full-screen loading feedback for authenticated app screens.
 */
export function ScreenLoadingState({
  title,
  message,
  className = "",
}: ScreenLoadingStateProps) {
  return (
    <View
      className={`flex-1 items-center justify-center bg-gray-50 px-6 py-10 ${className}`}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${title}. ${message}`}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator size="large" color="#0F766E" accessible={false} />
      <Text className="mt-5 text-center text-xl font-extrabold text-gray-900">
        {title}
      </Text>
      <Text className="mt-1.5 max-w-sm text-center text-base leading-6 text-gray-600">
        {message}
      </Text>
    </View>
  );
}

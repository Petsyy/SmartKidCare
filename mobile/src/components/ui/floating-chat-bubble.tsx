import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BRAND_HEADER_GRADIENT } from "./screen-header.constants";

interface FloatingChatBubbleProps {
  onPress: () => void;
  bottomOffset: number;
  hidden?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FloatingChatBubble({
  onPress,
  bottomOffset,
  hidden = false,
  disabled = false,
  className = "",
}: FloatingChatBubbleProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const entranceScale = useSharedValue(0.82);
  const pressScale = useSharedValue(1);
  const bubbleOpacity = useSharedValue(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );

    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      reduceMotionSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (hidden || keyboardVisible) return;

    if (reduceMotion) {
      entranceScale.value = 1;
      bubbleOpacity.value = 1;
      return;
    }

    entranceScale.value = 0.82;
    bubbleOpacity.value = 0;
    bubbleOpacity.value = withTiming(1, { duration: 220 });
    entranceScale.value = withSequence(
      withSpring(1, { damping: 14, stiffness: 180 }),
      withDelay(
        650,
        withSequence(
          withTiming(1.07, { duration: 160 }),
          withSpring(1, { damping: 12, stiffness: 180 }),
        ),
      ),
    );
  }, [bubbleOpacity, entranceScale, hidden, keyboardVisible, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: entranceScale.value * pressScale.value }],
  }));

  if (hidden || keyboardVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 50, elevation: 50 }]}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            right: 20,
            bottom: bottomOffset,
          },
          animatedStyle,
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            if (!reduceMotion) {
              pressScale.value = withTiming(0.93, { duration: 90 });
            }
          }}
          onPressOut={() => {
            pressScale.value = reduceMotion
              ? 1
              : withSpring(1, { damping: 14, stiffness: 220 });
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Open KidCare chat"
          accessibilityHint="Opens the parent AI messaging assistant"
          accessibilityState={{ disabled }}
          className={`h-16 w-16 rounded-full active:opacity-90 ${className}`}
          style={{
            opacity: disabled ? 0.6 : 1,
            elevation: 10,
            shadowColor: "#0F766E",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.32,
            shadowRadius: 9,
          }}
        >
          <LinearGradient
            colors={BRAND_HEADER_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-16 w-16 items-center justify-center rounded-full border-2 border-white"
          >
            <MessageCircle size={30} color="#FFFFFF" strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

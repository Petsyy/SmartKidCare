import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const SkeletonOpacityContext = createContext<Animated.Value | null>(null);

export interface SkeletonGroupProps {
  children: React.ReactNode;
  className?: string;
  accessibilityLabel?: string;
}

export function SkeletonGroup({
  children,
  className = "",
  accessibilityLabel = "Loading content",
}: SkeletonGroupProps) {
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) {
        opacity.setValue(0.65);
        return;
      }
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.45,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      className={className}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
    >
      <SkeletonOpacityContext.Provider value={opacity}>
        {children}
      </SkeletonOpacityContext.Provider>
    </Animated.View>
  );
}

export interface SkeletonBlockProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBlock({
  className = "h-4 rounded-lg bg-gray-200",
  style,
}: SkeletonBlockProps) {
  const opacity = useContext(SkeletonOpacityContext);

  return (
    <Animated.View
      className={className}
      style={[{ opacity: opacity ?? 0.65 }, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 2, className = "" }: SkeletonTextProps) {
  return (
    <Animated.View className={`gap-2 ${className}`} accessible={false}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBlock
          key={index}
          className={`h-3 rounded-full bg-gray-200 ${
            index === lines - 1 && lines > 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </Animated.View>
  );
}

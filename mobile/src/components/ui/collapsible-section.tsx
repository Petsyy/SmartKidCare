import { type ReactNode, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from "react-native";
import { ChevronDown } from "lucide-react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  /** Icon rendered inside a 40×40 rounded box on the left */
  icon: ReactNode;
  /** Section heading text */
  title: string;
  /** Whether the section starts expanded (default: false) */
  defaultExpanded?: boolean;
  /** Section content — only rendered when expanded */
  children: ReactNode;
}

/**
 * Collapsible card section with native smooth expand/collapse.
 */
export function CollapsibleSection({
  icon,
  title,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View className="mb-4 rounded-3xl border border-gray-100 bg-white px-4 pb-1 pt-4 shadow-sm">
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        accessibilityHint={`Tap to ${expanded ? "collapse" : "expand"} ${title}`}
        className="flex-row items-center active:opacity-70"
      >
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
          {icon}
        </View>
        <Text
          className="ml-3 flex-1 text-xl font-black text-gray-900"
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
          <ChevronDown size={22} color="#6B7280" />
        </View>
      </Pressable>

      {expanded ? <View className="mt-2 pb-3">{children}</View> : null}
    </View>
  );
}

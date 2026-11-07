import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import type { Child } from "@/src/api/parent.api";
import { getFullName } from "../../utils/parent-child-formatters";

export interface ChildSelectorPillsProps {
  childrenList: Child[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
}

export function ChildSelectorPills({
  childrenList,
  selectedChildId,
  onSelectChild,
}: ChildSelectorPillsProps) {
  if (childrenList.length <= 1) return null;

  return (
    <View className="mb-6">
      <Text className="mb-3 text-base font-semibold uppercase tracking-wide text-gray-500">
        Choose a child ({childrenList.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {childrenList.map((child) => {
          const isActive = child._id === selectedChildId;
          return (
            <Pressable
              key={child._id}
              onPress={() => onSelectChild(child._id)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${getFullName(child)}`}
              accessibilityState={{ selected: isActive }}
              className={`mr-3 min-h-11 justify-center rounded-full border px-5 ${
                isActive
                  ? "border-teal-600 bg-teal-600"
                  : "border-emerald-200 bg-white"
              }`}
            >
              <Text
                className={`text-lg font-black ${
                  isActive ? "text-white" : "text-gray-700"
                }`}
                numberOfLines={1}
              >
                {child.firstName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}


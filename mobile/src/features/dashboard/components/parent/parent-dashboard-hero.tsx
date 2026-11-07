import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, CalendarDays, School } from "lucide-react-native";
import { BRAND_HEADER_GRADIENT, OfflineStatusBanner } from "@/src/components/ui";

export interface ParentDashboardHeroProps {
  topInset: number;
  greeting: string;
  centerName: string;
  dateLabel: string;
  hasNotifications: boolean;
  onOpenNotifications: () => void;
}

export function ParentDashboardHero({
  topInset,
  greeting,
  centerName,
  dateLabel,
  hasNotifications,
  onOpenNotifications,
}: ParentDashboardHeroProps) {
  return (
    <>
      <LinearGradient
        colors={BRAND_HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: topInset + 10,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text
              className="text-3xl font-extrabold text-white"
              accessibilityRole="header"
              numberOfLines={2}
            >
              {greeting}
            </Text>
            <Text
              className="mt-0.5 text-base text-emerald-50"
              numberOfLines={2}
            >
              Here&apos;s what&apos;s happening today.
            </Text>
          </View>

          <Pressable
            onPress={onOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            accessibilityHint="Shows parent alerts and daily updates"
            className="relative h-12 w-12 items-center justify-center rounded-2xl bg-white/20 active:bg-white/30"
          >
            <Bell size={26} color="#FFFFFF" />
            {hasNotifications ? (
              <View
                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-teal-700 bg-orange-300"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            ) : null}
          </Pressable>
        </View>

        <View className="mt-3 flex-row items-center rounded-xl bg-white/15 px-3.5 py-2.5">
          <CalendarDays size={18} color="#D1FAE5" />
          <Text className="ml-2 text-sm font-semibold text-white">
            {dateLabel}
          </Text>
          <View className="mx-2.5 h-4 w-px bg-white/30" />
          <School size={18} color="#D1FAE5" />
          <Text
            className="ml-2 flex-1 text-sm font-medium text-emerald-50"
            numberOfLines={1}
          >
            {centerName}
          </Text>
        </View>
      </LinearGradient>
      <OfflineStatusBanner />
    </>
  );
}


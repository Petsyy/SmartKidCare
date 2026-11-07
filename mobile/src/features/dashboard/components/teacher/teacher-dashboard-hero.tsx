import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, CalendarDays, School } from "lucide-react-native";
import { TEACHER_HEADER_GRADIENT, OfflineStatusBanner } from "@/src/components/ui";

export interface TeacherDashboardHeroProps {
  topInset: number;
  teacherName: string;
  centerName: string;
  dateLabel: string;
  hasNotifications: boolean;
  onOpenNotifications: () => void;
}

export function TeacherDashboardHero({
  topInset,
  teacherName,
  centerName,
  dateLabel,
  hasNotifications,
  onOpenNotifications,
}: TeacherDashboardHeroProps) {
  return (
    <>
      <LinearGradient
        colors={TEACHER_HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: topInset + 14,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text
              className="text-3xl font-extrabold text-white"
              accessibilityRole="header"
              numberOfLines={2}
            >
              Good day, {teacherName}
            </Text>
            <Text className="mt-1 text-base text-emerald-50" numberOfLines={2}>
              Keep today&apos;s class moving forward.
            </Text>
          </View>

          <Pressable
            onPress={onOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            accessibilityHint="Shows teacher alerts and reminders"
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

        <View className="mt-3.5 flex-row items-center rounded-xl bg-white/15 px-3.5 py-2.5">
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


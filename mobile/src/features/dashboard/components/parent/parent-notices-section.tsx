import React from "react";
import { View, Text, Pressable } from "react-native";
import { Bell } from "lucide-react-native";
import type { ParentNotificationFeedItem } from "@/src/api/notifications.api";
import { NoticeItem } from "../common/notice-item";

const PARENT_NOTICE_TONE: Record<
  ParentNotificationFeedItem["type"],
  "emerald" | "blue" | "orange"
> = {
  attendance_submitted: "emerald",
  absence_alert: "orange",
  feeding_submitted: "blue",
  missed_meal_alert: "orange",
  pickup_code_generated: "blue",
  child_released: "emerald",
  pickup_reminder: "blue",
  competency_practice: "orange",
};

export interface ParentNoticesSectionProps {
  childFirstName: string;
  notifications: ParentNotificationFeedItem[];
  onViewAll: () => void;
  onPressNotice: (item: ParentNotificationFeedItem) => void;
}

export function ParentNoticesSection({
  childFirstName,
  notifications,
  onViewAll,
  onPressNotice,
}: ParentNoticesSectionProps) {
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <>
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text
            className="text-2xl font-black text-gray-900"
            accessibilityRole="header"
          >
            Recent updates
          </Text>
          <Text className="mt-0.5 text-base text-gray-600">
            School updates about {childFirstName}
          </Text>
        </View>
        {notifications.length > 0 ? (
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="View all notifications"
            className="min-h-11 flex-row items-center justify-center rounded-full border border-gray-100 bg-white px-4 shadow-sm active:opacity-75"
          >
            <Text className="text-sm font-extrabold text-gray-700">
              View all
            </Text>
          </Pressable>
        ) : null}
      </View>

      {visibleNotifications.length > 0 ? (
        <View className="rounded-3xl border border-gray-100 bg-white p-3.5 shadow-sm">
          {visibleNotifications.map((item, index) => {
            const tone = PARENT_NOTICE_TONE[item.type] || "emerald";

            const notificationHint =
              item.type === "attendance_submitted" ||
              item.type === "absence_alert"
                ? "Opens attendance record"
                : item.type === "feeding_submitted" ||
                    item.type === "missed_meal_alert"
                  ? "Opens feeding record"
                  : "Opens all notifications";

            return (
              <React.Fragment key={item.id}>
                <NoticeItem
                  title={item.title}
                  desc={item.message}
                  meta={item.timeLabel}
                  tone={tone}
                  onPress={() => onPressNotice(item)}
                  accessibilityHint={notificationHint}
                />
                {index < visibleNotifications.length - 1 ? (
                  <View className="h-2.5" />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <View className="items-center rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
          <View className="h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
            <Bell size={22} color="#6B7280" />
          </View>
          <Text className="mt-2 text-lg font-extrabold text-gray-900">
            Quiet for now
          </Text>
          <Text className="mt-0.5 text-center text-sm leading-5 text-gray-600">
            New school updates for {childFirstName} will appear here.
          </Text>
        </View>
      )}
    </>
  );
}


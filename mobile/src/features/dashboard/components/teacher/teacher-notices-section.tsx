import React from "react";
import { View, Text, Pressable } from "react-native";
import { Bell } from "lucide-react-native";
import type { TeacherNotificationFeedItem } from "@/src/api/notifications.api";
import { NoticeItem } from "../common/notice-item";

const NOTICE_TYPE_UI: Record<
  TeacherNotificationFeedItem["type"],
  {
    fallbackTitle: string;
    tone: "emerald" | "blue" | "orange";
  }
> = {
  attendance_reminder: {
    fallbackTitle: "Morning Attendance",
    tone: "emerald",
  },
  attendance_incomplete: {
    fallbackTitle: "Attendance Incomplete",
    tone: "orange",
  },
  feeding_reminder: {
    fallbackTitle: "Lunch Feeding",
    tone: "blue",
  },
  feeding_incomplete: {
    fallbackTitle: "Feeding Incomplete",
    tone: "orange",
  },
  attendance_submitted: {
    fallbackTitle: "",
    tone: "emerald",
  },
  feeding_submitted: {
    fallbackTitle: "",
    tone: "emerald",
  },
};

export interface TeacherNoticesSectionProps {
  notifications: TeacherNotificationFeedItem[];
  onViewAll: () => void;
  onPressNotice: (item: TeacherNotificationFeedItem) => void;
}

export function TeacherNoticesSection({
  notifications,
  onViewAll,
  onPressNotice,
}: TeacherNoticesSectionProps) {
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <>
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text
            className="text-2xl font-black text-gray-900"
            accessibilityRole="header"
          >
            Notifications
          </Text>
          <Text className="mt-0.5 text-base text-gray-600">
            Reminders that need your attention
          </Text>
        </View>
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel="View all notifications"
          className="min-h-11 flex-row items-center justify-center rounded-full border border-gray-100 bg-white px-4 shadow-sm active:opacity-75"
        >
          <Text className="text-sm font-extrabold text-emerald-800">
            View all
          </Text>
        </Pressable>
      </View>

      {visibleNotifications.length > 0 ? (
        <View className="rounded-3xl border border-gray-100 bg-white p-3.5 shadow-sm">
          {visibleNotifications.map((item, index) => {
            const ui = NOTICE_TYPE_UI[item.type];
            const title =
              item.title === "Reminder" ? ui.fallbackTitle : item.title;

            const notificationHint =
              item.type === "attendance_reminder" ||
              item.type === "attendance_incomplete"
                ? "Opens attendance record"
                : item.type === "feeding_reminder" ||
                    item.type === "feeding_incomplete"
                  ? "Opens feeding record"
                  : "Opens all notifications";

            return (
              <React.Fragment key={item.id}>
                <NoticeItem
                  title={title}
                  desc={item.message}
                  meta={item.timeLabel}
                  tone={ui.tone}
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
        <View className="items-center rounded-3xl border border-gray-100 bg-white px-5 py-8 shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
            <Bell size={26} color="#0F766E" />
          </View>
          <Text className="mt-3 text-lg font-extrabold text-gray-900">
            Quiet for now
          </Text>
          <Text className="mt-1 text-center text-base text-gray-600">
            New reminders will appear here.
          </Text>
        </View>
      )}
    </>
  );
}


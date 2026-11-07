import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { Mail, Phone, User } from "lucide-react-native";
import { ProfileSection } from "@/src/components/ui";
import type { Child } from "@/src/api/parent.api";
import { getTeacherFullName } from "../../utils/parent-child-formatters";

export interface ChildTeacherContactSectionProps {
  child: Child;
}

export function ChildTeacherContactSection({
  child,
}: ChildTeacherContactSectionProps) {
  if (!child.teacher) {
    return (
      <ProfileSection
        icon={<User size={22} color="#047857" />}
        title="Teacher Contact"
        tone="emerald"
      >
        <View
          className="min-h-14 flex-row items-center justify-between py-3.5"
          accessible
          accessibilityLabel="Status: Not assigned yet"
        >
          <Text className="text-base font-bold text-gray-500">Status</Text>
          <View className="rounded-full bg-amber-50 px-3 py-1">
            <Text className="text-base font-extrabold text-amber-800">
              Not assigned yet
            </Text>
          </View>
        </View>
      </ProfileSection>
    );
  }

  const teacher = child.teacher;
  const teacherFullName = getTeacherFullName(child);

  return (
    <ProfileSection
      icon={<User size={22} color="#047857" />}
      title="Teacher Contact"
      tone="emerald"
    >
      <View className="pt-2">
        <View className="mb-3 rounded-2xl border border-emerald-100/80 bg-emerald-50/40 p-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Assigned Teacher
          </Text>
          <Text className="mt-1 text-base font-extrabold text-gray-900">
            {teacherFullName}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            {teacher.email || "No email available"}
          </Text>
        </View>

        {/* Quick Contact Buttons */}
        <View className="flex-row gap-2.5">
          {teacher.phone?.trim() ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${teacher.phone}`)}
              accessibilityRole="button"
              accessibilityLabel="Call Teacher"
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 active:opacity-85"
            >
              <Phone size={16} color="white" />
              <Text className="text-sm font-bold text-white">Call Teacher</Text>
            </Pressable>
          ) : null}

          {teacher.email?.trim() ? (
            <Pressable
              onPress={() => Linking.openURL(`mailto:${teacher.email}`)}
              accessibilityRole="button"
              accessibilityLabel="Email Teacher"
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
            >
              <Mail size={16} color="#374151" />
              <Text className="text-sm font-bold text-gray-700">Email</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ProfileSection>
  );
}


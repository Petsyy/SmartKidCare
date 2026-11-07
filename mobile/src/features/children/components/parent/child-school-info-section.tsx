import React from "react";
import { View, Text } from "react-native";
import { School, User } from "lucide-react-native";
import { ProfileSection } from "@/src/components/ui";
import type { Child } from "@/src/api/parent.api";
import {
  NOT_PROVIDED,
  getTeacherFullName,
} from "../../utils/parent-child-formatters";

export interface ChildSchoolInfoSectionProps {
  child: Child;
}

export function ChildSchoolInfoSection({ child }: ChildSchoolInfoSectionProps) {
  return (
    <ProfileSection
      icon={<School size={22} color="#0D9488" />}
      title="School Information"
      tone="teal"
    >
      <View className="pt-2">
        {/* Program & School Year Badge Tile */}
        <View className="mb-3 rounded-2xl border border-teal-100/70 bg-teal-50/50 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Enrolled Program
              </Text>
              <Text className="mt-1 text-base font-extrabold text-teal-950">
                {child.programType || NOT_PROVIDED}
              </Text>
            </View>
            <View className="rounded-full border border-teal-100 bg-white px-3 py-1 shadow-2xs">
              <Text className="text-xs font-bold text-teal-800">
                SY {child.schoolYear || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Assigned Teacher Mini Row */}
        <View className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
          <View className="flex-row items-center gap-2.5">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-teal-100/60">
              <User size={16} color="#0D9488" />
            </View>
            <View>
              <Text className="text-[11px] font-medium text-gray-400">
                Class Teacher
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-gray-800">
                {getTeacherFullName(child)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ProfileSection>
  );
}


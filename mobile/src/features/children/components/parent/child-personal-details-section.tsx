import React from "react";
import { View, Text } from "react-native";
import { BookOpen, MapPin, Ruler, Scale, Sparkles, User } from "lucide-react-native";
import { ProfileSection } from "@/src/components/ui";
import type { Child } from "@/src/api/parent.api";
import {
  formatDate,
  toTitleCase,
} from "../../utils/parent-child-formatters";

export interface ChildPersonalDetailsSectionProps {
  child: Child;
}

export function ChildPersonalDetailsSection({
  child,
}: ChildPersonalDetailsSectionProps) {
  return (
    <ProfileSection
      icon={<User size={22} color="#0D9488" />}
      title="Child Information"
      tone="teal"
    >
      <View className="pt-2">
        {/* Metric Highlights */}
        <View className="mb-3 flex-row gap-2">
          <View className="flex-1 items-center rounded-2xl border border-teal-100/60 bg-teal-50/60 p-3">
            <View className="mb-1 flex-row items-center gap-1">
              <BookOpen size={13} color="#0D9488" />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Age
              </Text>
            </View>
            <Text className="text-base font-extrabold text-teal-950">
              {child.age ? `${child.age} yrs` : "—"}
            </Text>
          </View>

          <View className="flex-1 items-center rounded-2xl border border-sky-100/60 bg-sky-50/60 p-3">
            <View className="mb-1 flex-row items-center gap-1">
              <Scale size={13} color="#0284C7" />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                Weight
              </Text>
            </View>
            <Text className="text-base font-extrabold text-sky-950">
              {child.weight ? `${child.weight} kg` : "—"}
            </Text>
          </View>

          <View className="flex-1 items-center rounded-2xl border border-indigo-100/60 bg-indigo-50/60 p-3">
            <View className="mb-1 flex-row items-center gap-1">
              <Ruler size={13} color="#4F46E5" />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Height
              </Text>
            </View>
            <Text className="text-base font-extrabold text-indigo-950">
              {child.height ? `${child.height} cm` : "—"}
            </Text>
          </View>
        </View>

        {/* Vitals & Dates Micro-Card */}
        <View className="mb-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={14} color="#0D9488" />
              <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Personal Details
              </Text>
            </View>
            {child.gender ? (
              <View className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-0.5">
                <Text className="text-[11px] font-bold text-teal-800">
                  {toTitleCase(child.gender)}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row justify-between pt-1">
            <View className="flex-1 pr-2">
              <Text className="text-[11px] font-medium text-gray-400">
                Date of Birth
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-gray-800">
                {child.dateOfBirth
                  ? formatDate(child.dateOfBirth)
                  : "Not provided"}
              </Text>
            </View>
            <View className="flex-1 pl-2">
              <Text className="text-[11px] font-medium text-gray-400">
                Enrolled On
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-gray-800">
                {formatDate(child.enrollmentDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Home Address Card */}
        <View className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
          <View className="flex-row items-start gap-2.5">
            <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg bg-teal-100/60">
              <MapPin size={14} color="#0D9488" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-medium text-gray-400">
                Home Address
              </Text>
              <Text className="mt-0.5 text-sm font-medium leading-5 text-gray-800">
                {child.homeAddress?.trim()
                  ? child.homeAddress
                  : "No address provided"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ProfileSection>
  );
}


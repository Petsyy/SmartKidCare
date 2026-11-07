import React from "react";
import { View, Text } from "react-native";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react-native";
import type { Child } from "@/src/api/parent.api";
import {
  getChildDetails,
  getEnrollmentStatus,
  getFullName,
} from "../../utils/parent-child-formatters";

interface StatusPillProps {
  label: string;
  status: string | null;
}

function StatusPill({ label, status }: StatusPillProps) {
  const normalizedStatus = status?.trim().toLowerCase() ?? null;
  const isPositive =
    normalizedStatus === "present" || normalizedStatus === "completed";
  const isNegative =
    normalizedStatus === "absent" || normalizedStatus === "missed";

  const iconBackgroundClass = isPositive
    ? "bg-emerald-100"
    : isNegative
      ? "bg-red-100"
      : "bg-gray-200";

  const textClass = isPositive
    ? "text-emerald-700"
    : isNegative
      ? "text-red-700"
      : "text-gray-700";

  const displayValue = isPositive
    ? normalizedStatus === "present"
      ? "Present"
      : "Completed"
    : isNegative
      ? normalizedStatus === "absent"
        ? "Absent"
        : "Missed"
      : "No record";

  const StatusIcon = isPositive
    ? CheckCircle2
    : isNegative
      ? AlertCircle
      : Clock3;

  const iconColor = isPositive ? "#047857" : isNegative ? "#DC2626" : "#4B5563";

  return (
    <View
      className="flex-row items-center"
      accessible
      accessibilityLabel={`${label}: ${displayValue}`}
    >
      <View
        className={`h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBackgroundClass}`}
      >
        <StatusIcon size={18} color={iconColor} />
      </View>
      <View className="ml-2.5 flex-1 justify-center">
        <Text className="text-xs font-semibold text-gray-500">{label}</Text>
        <Text
          numberOfLines={1}
          className={`text-sm font-extrabold ${textClass} mt-0.5`}
        >
          {displayValue}
        </Text>
      </View>
    </View>
  );
}

export interface ParentChildProfileCardProps {
  child: Child;
  attendanceStatus: string | null;
  feedingStatus: string | null;
}

export function ParentChildProfileCard({
  child,
  attendanceStatus,
  feedingStatus,
}: ParentChildProfileCardProps) {
  const enrollmentStatus = getEnrollmentStatus(child.status);
  const fullName = getFullName(child);
  const details = getChildDetails(child);

  return (
    <>
      {child.status === "Inactive" ? (
        <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Text className="text-lg font-bold text-amber-900">
            Archived enrollment
          </Text>
          <Text className="mt-1 text-sm leading-5 text-amber-800">
            This profile is read-only. Historical records remain available.
            {child.archiveReason
              ? ` Reason: ${child.archiveReason}.`
              : " Reason unavailable."}
          </Text>
        </View>
      ) : null}

      <View className="mb-4 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-3 pr-2">
            {/* Child Avatar Initials */}
            <View className="h-12 w-12 items-center justify-center rounded-2xl border border-teal-200 bg-teal-100">
              <Text className="text-lg font-black text-teal-800">
                {child.firstName?.[0] || ""}{child.lastName?.[0] || ""}
              </Text>
            </View>

            <View
              accessible
              accessibilityLabel={`${fullName}. ${details}. ${enrollmentStatus.label}`}
              className="flex-1"
            >
              <Text
                className="text-xl font-black leading-7 text-gray-900"
                numberOfLines={1}
                accessibilityRole="header"
              >
                {fullName}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <Text className="text-xs font-semibold text-gray-500">
                  {details}
                </Text>
              </View>
            </View>
          </View>

          {/* Enrollment status badge */}
          <View
            className={`flex-row items-center rounded-full px-3 py-1 ${
              enrollmentStatus.isActive
                ? "border border-emerald-200 bg-emerald-50"
                : "border border-gray-200 bg-gray-100"
            }`}
          >
            <View
              className={`mr-1.5 h-2 w-2 rounded-full ${
                enrollmentStatus.isActive ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
            <Text
              className={`text-xs font-bold ${
                enrollmentStatus.isActive
                  ? "text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              {enrollmentStatus.label}
            </Text>
          </View>
        </View>

        {/* Today's Care Highlights */}
        <View className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/90 p-3.5">
          <Text className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Today’s Care
          </Text>
          <View className="flex-row items-stretch gap-2.5">
            <View className="flex-1 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-2xs">
              <StatusPill label="Attendance" status={attendanceStatus} />
            </View>
            <View className="flex-1 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-2xs">
              <StatusPill label="Feeding" status={feedingStatus} />
            </View>
          </View>
        </View>
      </View>
    </>
  );
}


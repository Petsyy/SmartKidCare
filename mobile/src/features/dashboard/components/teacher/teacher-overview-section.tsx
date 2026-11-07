import React from "react";
import { View, Text } from "react-native";
import {
  HeartPulse,
  KeyRound,
  UserCheck,
  Users,
  UserX,
} from "lucide-react-native";
import { TeacherOverviewStatCard } from "./teacher-overview-stat-card";

export interface TeacherOverviewSectionProps {
  totalChildren: number;
  presentToday: number;
  absentToday: number;
  pendingPickups: number;
  underweightCount: number;
  severelyUnderweightCount: number;
  overweightCount: number;
  obeseCount: number;
  hasChildren: boolean;
  attendanceSubmitted: boolean;
  attendanceAvailable: boolean;
  onOpenChildren: () => void;
  onOpenPickup: () => void;
  onOpenNutrition: () => void;
}

export function TeacherOverviewSection({
  totalChildren,
  presentToday,
  absentToday,
  pendingPickups,
  underweightCount,
  severelyUnderweightCount,
  overweightCount,
  obeseCount,
  hasChildren,
  attendanceSubmitted,
  attendanceAvailable,
  onOpenChildren,
  onOpenPickup,
  onOpenNutrition,
}: TeacherOverviewSectionProps) {
  const combinedUnderweight = underweightCount + severelyUnderweightCount;
  const combinedOverweight = overweightCount + obeseCount;

  return (
    <View className="mb-5">
      <Text
        className="text-2xl font-black text-gray-900"
        accessibilityRole="header"
      >
        Today&apos;s overview
      </Text>
      <Text className="mt-0.5 text-base text-gray-600">
        Your latest class numbers
      </Text>

      <View className="mt-3.5 flex-row gap-3">
        <TeacherOverviewStatCard
          icon={Users}
          value={totalChildren}
          label="Total children"
          caption="Assigned to you"
          tone="sky"
          onPress={onOpenChildren}
          accessibilityHint="Opens your enrolled children roster"
          accessibilityLabel={`${totalChildren} total ${
            totalChildren === 1 ? "child" : "children"
          } in your class`}
        />

        <TeacherOverviewStatCard
          icon={UserCheck}
          value={attendanceAvailable ? presentToday : 0}
          label="Present today"
          caption={
            !hasChildren
              ? "No children assigned"
              : attendanceAvailable
                ? "In class"
                : "Awaiting attendance"
          }
          tone="emerald"
          muted={!attendanceAvailable}
          onPress={hasChildren ? onOpenChildren : undefined}
          accessibilityHint={
            hasChildren ? "Opens your enrolled children roster" : undefined
          }
          accessibilityLabel={
            !hasChildren
              ? "Present today is unavailable because no children are assigned"
              : attendanceAvailable
                ? `${presentToday} ${presentToday === 1 ? "child" : "children"} present today`
                : "Present today is awaiting attendance"
          }
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        <TeacherOverviewStatCard
          icon={UserX}
          value={attendanceAvailable ? absentToday : 0}
          label="Absent today"
          caption={
            !hasChildren
              ? "No children assigned"
              : attendanceSubmitted
                ? "Not in class"
                : "Awaiting attendance"
          }
          tone="rose"
          muted={!attendanceAvailable}
          onPress={hasChildren ? onOpenChildren : undefined}
          accessibilityHint={
            hasChildren ? "Opens your enrolled children roster" : undefined
          }
          accessibilityLabel={
            !hasChildren
              ? "Absent today is unavailable because no children are assigned"
              : attendanceSubmitted
                ? `${absentToday} ${absentToday === 1 ? "child" : "children"} absent today`
                : "Absent today is awaiting attendance"
          }
        />

        <TeacherOverviewStatCard
          icon={KeyRound}
          value={pendingPickups}
          label="Pending pickups"
          caption={
            !hasChildren
              ? "No children assigned"
              : `${pendingPickups} children waiting`
          }
          tone="orange"
          muted={!hasChildren || pendingPickups === 0}
          onPress={hasChildren ? onOpenPickup : undefined}
          accessibilityHint={
            hasChildren ? "Opens the safe pickup scanner" : undefined
          }
          accessibilityLabel={
            !hasChildren
              ? "Pending pickups is unavailable because no children are assigned"
              : `${pendingPickups} children are waiting for pickup`
          }
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        <TeacherOverviewStatCard
          icon={HeartPulse}
          value={combinedUnderweight || 0}
          label="Underweight"
          caption="Latest health metrics"
          tone="rose"
          muted={combinedUnderweight === 0}
          onPress={onOpenNutrition}
          accessibilityLabel={`${combinedUnderweight} underweight children`}
        />
        <TeacherOverviewStatCard
          icon={HeartPulse}
          value={combinedOverweight || 0}
          label="Overweight / Obese"
          caption="Latest health metrics"
          tone="orange"
          muted={combinedOverweight === 0}
          onPress={onOpenNutrition}
          accessibilityLabel={`${combinedOverweight} overweight or obese children`}
        />
      </View>
    </View>
  );
}


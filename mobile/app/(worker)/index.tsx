import React from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from "react-native";
import * as Icons from "lucide-react-native";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  variant?: "blue" | "green" | "white";
  icon: React.ReactNode;
};

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
};

type NoticeItemProps = {
  title: string;
  desc: string;
  tone?: "emerald" | "blue" | "orange";
  onPress?: () => void;
};

export default function WorkerDashboard() {
  const router = useRouter();
  // Demo data (replace with real API/state)
  const workerName = "Elena";
  const dateLabel = "Friday, January 30, 2026";
  const centerName = "Bonuan Child Development Center";
  const newNotifs = 2;

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-teal-50 to-emerald-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1">
        <View className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-teal-100 via-teal-50 to-transparent opacity-40" />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-28 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-4">
            <Text className="text-4xl font-extrabold text-gray-900">
              Good Morning, {workerName}!
            </Text>
            <Text className="mt-1 text-base text-gray-500">
              Here's your overview for today
            </Text>
          </View>

          {/* Date / Center Card */}
          <View className="mb-5 rounded-3xl border border-teal-500 bg-teal-500 p-4">
            <View className="flex-row items-start">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-100">
                <Icons.Calendar size={20} color="#059669" />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-lg font-semibold text-white">
                  {dateLabel}
                </Text>

                <View className="mt-1 flex-row items-center">
                  <Icons.Home size={16} color="white" />
                  <Text className="ml-1.5 text-base text-white">
                    {centerName}
                  </Text>
                </View>

                <View className="mt-3 self-start rounded-full border border-gray-200 bg-white px-3 py-2">
                  <View className="flex-row items-center">
                    <View className="h-2 w-2 rounded-full bg-rose-400" />
                    <Text className="ml-2 text-base font-medium text-gray-800">
                      {newNotifs} new notifications
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Grid (2x2) */}
          <View className="mb-6 flex-row gap-4">
            <View className="flex-1">
              <StatCard
                title="Total Children"
                value={6}
                subtitle="Enrolled today"
                icon={<Icons.Users size={24} color="#0284C7" />}
                variant="blue"
              />
            </View>
            <View className="flex-1">
              <StatCard
                title="Present Today"
                value={0}
                subtitle="6 pending"
                icon={<Icons.UserCheck size={24} color="#059669" />}
                variant="green"
              />
            </View>
          </View>

          <View className="mb-7 flex-row gap-4">
            <View className="flex-1">
              <StatCard
                title="Absent Today"
                value={0}
                subtitle="0 excused"
                icon={<Icons.UserX size={24} color="#374151" />}
                variant="white"
              />
            </View>
            <View className="flex-1">
              <StatCard
                title="Feeding Done"
                value={0}
                subtitle="6 pending"
                icon={<Icons.UtensilsCrossed size={24} color="#059669" />}
                variant="green"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-7 rounded-3xl bg-white p-5 shadow-sm">
            <View className="mb-4 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                <Icons.Zap size={18} color="#059669" />
              </View>
              <Text className="ml-3 text-xl font-bold text-gray-900">
                Quick Actions
              </Text>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <ActionCard
                  title="Record Attendance"
                  subtitle="6 pending"
                  icon={<Icons.ClipboardCheck size={22} color="#059669" />}
                  onPress={() => router.push("/(worker)/worker-record-data/attendance")}
                />
              </View>

              <View className="flex-1">
                <ActionCard
                  title="Record Feeding"
                  subtitle="6 pending"
                  icon={<Icons.Utensils size={22} color="#059669" />}
                  onPress={() => router.push("/(worker)/worker-record-data/feeding")}
                />
              </View>
            </View>
          </View>

          {/* Recent Notifications */}
          <View className="rounded-3xl bg-white p-5 shadow-sm">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">
                Recent Notifications
              </Text>

              <Pressable className="flex-row items-center">
                <Text className="text-base font-semibold text-gray-700">
                  View all
                </Text>
                <Icons.ChevronRight size={18} color="#374151" />
              </Pressable>
            </View>

            <NoticeItem
              title="Monthly Report Due"
              desc="Please submit the monthly attendance and feeding report."
              tone="emerald"
              onPress={() => {}}
            />
            <View className="h-3" />
            <NoticeItem
              title="System Maintenance"
              desc="The system will undergo maintenance on Saturday."
              tone="blue"
              onPress={() => {}}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- Components ---------------- */
function StatCard({ title, value, subtitle, variant = "white", icon }: StatCardProps) {
  const styles =
    variant === "blue"
      ? "bg-sky-50 border-sky-100"
      : variant === "green"
      ? "bg-emerald-50 border-emerald-100"
      : "bg-white border-gray-100";

  const iconWrap =
    variant === "blue"
      ? "bg-sky-100"
      : variant === "green"
      ? "bg-emerald-100"
      : "bg-gray-100";

  const iconColor =
    variant === "blue" ? "#0284C7" : variant === "green" ? "#059669" : "#374151";

  return (
    <View className={`rounded-3xl border p-4 ${styles} shadow-sm`}>
      <View className="flex-row items-start gap-3">
        <View className={`h-12 w-12 items-center justify-center rounded-2xl ${iconWrap}`}>
          {icon}
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-700">{title}</Text>
          <Text className="mt-2 text-4xl font-extrabold text-gray-900">{value}</Text>
          <Text className="mt-1 text-base font-semibold text-gray-600">{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

function ActionCard({ title, subtitle, icon, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm active:opacity-90"
    >
      <View className="items-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          {icon}
        </View>

        <Text className="mt-3 text-center text-base font-bold text-gray-900">
          {title}
        </Text>

        <Text className="mt-1 text-center text-sm font-medium text-gray-500">
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function NoticeItem({ title, desc, tone = "emerald", onPress }: NoticeItemProps) {
  const bar =
    tone === "emerald" ? "bg-emerald-600" : tone === "blue" ? "bg-sky-600" : "bg-orange-500";

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl bg-gray-50 p-4 active:opacity-90"
    >
      <View className="flex-row">
        <View className={`mr-4 w-1.5 rounded-full ${bar}`} />
        <View className="flex-1">
          <Text className="text-base font-extrabold text-gray-900">{title}</Text>
          <Text className="mt-1 text-sm leading-5 text-gray-600">{desc}</Text>
        </View>
      </View>
    </Pressable>
  );
}

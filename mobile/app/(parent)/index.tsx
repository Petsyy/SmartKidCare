import {
  Users,
  UserCheck,
  UserX,
  Utensils,
  Calendar,
  MapPin,
  ReceiptText,
  MapPinIcon,
  CalendarIcon,
} from "lucide-react-native";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMyChildren, Child } from "@/src/api/parent.api";
import {
  StatRow,
  ProgressBar,
} from "@/src/utils/dashboard-overview";
import { useEffect, useMemo } from "react";

export default function ParentDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleViewFeeding = () => {
    router.push("./parent-view-record/feeding");
  };

  const handleViewAttendance = () => {
    router.push("./parent-view-record/attendance");
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("No authentication token");

        const saveChildId = await AsyncStorage.getItem("saveChildId");

        const data = await getMyChildren(token);
        setChildren(data);

        const fallback = data?.[0]?._id ?? null;
        const initialChild =
          saveChildId && data.some((c) => c._id === saveChildId)
            ? saveChildId
            : fallback;

        setSelectedChildId(initialChild);
      } catch (err: any) {
        setError(err?.message || "Failed to load children");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const child = useMemo(() => {
    if (!selectedChildId) return children[0] ?? null;
    return children.find((c) => c._id === selectedChildId) ?? children[0] ?? null;
  }, [children, selectedChildId]);

  const childFullName = useMemo(() => {
    if (!child) return "";
    const middle = child.middleName ? ` ${child.middleName}` : "";
    return `${child.firstName}${middle} ${child.lastName}`.replace(/\s+/g, " ").trim();
  }, [child]);

  const childAge = child?.age ?? "-";
  const childGender = child?.gender ? child.gender : "-";

  const centerName =
    (child as any)?.centerName ||
    (child as any)?.schoolName ||
    "Bonuan Child Development Center";
  const enrolledText =
    (child as any)?.enrollmentDate
      ? new Date((child as any).enrollmentDate).toLocaleDateString()
      : (child as any)?.enrolledAt
        ? new Date((child as any).enrolledAt).toLocaleDateString()
        : "-";


  const initials = useMemo(() => {
    if (!child) return "";
    const a = child.firstName.charAt(0) ?? "";
    const b = child.lastName.charAt(0) ?? "";
    return (a + b).toUpperCase() || "-";
  }, [child]);

  if (loading) {
    return (
      <ScrollView
        className="flex- 1 bg-teal-50 px-6"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <ActivityIndicator />
      </ScrollView>
    );

  }

  if (error) {
    return (
      <ScrollView
        className="flex- 1 bg-teal-50 px-6"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Text className="text-red-500">{error}</Text>
      </ScrollView>
    );
  }

  if (!child) {
    return (
      <ScrollView
        className="flex- 1 bg-teal-50 px-6"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Text className="text-gray-500">No children linked to your account.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-teal-50 px-6"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 20,
      }}
      scrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-6">
        <Text className="text-4xl font-bold text-gray-900">Dashboard</Text>
        <Text className="text-lg text-gray-600 mt-2">
          Welcome back! Here's an overview of your child's activity.
        </Text>
      </View>

      {/* Child header card */}
      <View className="flex-row bg-teal-500 rounded-2xl p-6 mb-8 items-center">
        <View className="w-20 h-20 bg-teal-300 rounded-full items-center justify-center mr-4">
          <Text className="text-white text-2xl font-bold">{initials}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">{childFullName}</Text>
          <Text className="text-teal-100 text-base">
            {childAge} years old • {String(childGender).toLowerCase()}
          </Text>

          <View className="flex-row items-center mt-2">
            <MapPinIcon size={18} color="white" />
            <Text className="text-teal-100 text-sm ml-2" numberOfLines={1}>
              {centerName}
            </Text>
          </View>

          <View className="flex-row items-center mt-2">
            <CalendarIcon size={18} color="white" />
            <Text className="text-teal-100 text-sm ml-2">
              Enrolled: {enrolledText}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View>
        <Text className="text-xl font-bold text-gray-800 mt-1">Quick Actions</Text>

        <View className="flex-row mt-4 space-x-4 gap-4">
          <Pressable
            className="flex-1 flex-row bg-teal-500 rounded-2xl py-5 px-4 items-center"
            onPress={handleViewAttendance}
          >
            <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center mr-2 flex-shrink-0">
              <ReceiptText size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold mt-1">
              Attendance Details
            </Text>
          </Pressable>

          <Pressable
            className="flex-1 flex-row bg-teal-500 rounded-2xl py-5 px-4 items-center"
            onPress={handleViewFeeding}
          >
            <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center mr-2 flex-shrink-0">
              <Utensils size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold mt-1">
              Feeding Details
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Summary cards (still static until you wire record APIs) */}
      <View className="mt-6">
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center mb-3">
            <Calendar size={18} color="#10B981" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Attendance Breakdown
            </Text>
          </View>
          <StatRow color="#22C55E" label="Present" value="33 days" />
          <StatRow color="#9CA3AF" label="Absent" value="0 days" />
        </View>

        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Utensils size={18} color="#10B981" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Feeding Overview
            </Text>
          </View>
          <StatRow color="#22C55E" label="Meals Completed" value="32 days" />
          <StatRow color="#9CA3AF" label="Meals Missed" value="4 days" />

          <View className="mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Completion Rate</Text>
              <Text className="text-teal-600 font-semibold">89%</Text>
            </View>
            <View className="mt-2">
              <ProgressBar percent={89} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

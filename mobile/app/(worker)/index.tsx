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
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  StatRow,
  ProgressBar,
} from "../../src/components/helpers/dashboard-helpers";

export default function ParentDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRecordFeeding = () => {
    router.push("./worker-record/feeding");
  };

  const handleRecordAttendance = () => {
    router.push("./worker-record/attendance");
  };

  return (
    <ScrollView
      className="flex-1 bg-teal-50 px-6"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 20,
      }}
      scrollEnabled={true}
      showsVerticalScrollIndicator={true}
    >
      {/* Greeting Section */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-800">Dashboard</Text>
        <Text className="text-base text-gray-500 mt-1">
          Welcome back! Here's an overview of your child's activity.
        </Text>
      </View>

      <View className="flex-row bg-teal-500 rounded-2xl p-4 mb-6 items-center">
        <View className="w-20 h-20 bg-teal-300 rounded-full items-center justify-center mr-4">
          <Text className="text-white text-2xl font-bold">VC</Text>
        </View>

        <View className="flex-1">

          <Text className="text-white text-2xl font-bold">
            Vash Catangongan
          </Text>

          <Text className="text-teal-200 text-lg">5 years old • Male</Text>

          <View className="flex-row items-center mt-2">
            <MapPinIcon size={20} color="white" />
            <Text className="text-teal-200 text-lg ml-2">
              Bonuan Child Developement Center
            </Text>
          </View>

          <View className="flex-row items-center mt-2">
            <CalendarIcon size={20} color="white" />
            <Text className="text-teal-200 text-lg mt-1 ml-2">
              Enrolled: January 2026
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      {/* Record Feeding Button */}
      <View>
        <Text className="text-xl font-bold text-gray-800 mt-1">
          Quick Actions
        </Text>
        <View className="flex-row mt-4 space-x-4 gap-4">
          <Pressable
            className="flex-1 flex-row bg-teal-500 rounded-2xl py-5 px-4 items-center"
            onPress={handleRecordFeeding}
          >
            <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center r mr-2 flex-shrink-0">
              <ReceiptText size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold mt-1">
              Record Feeding
            </Text>
          </Pressable>
          {/* Record Attendance Button */}
          <Pressable
            className="flex-1 flex-row bg-teal-500 rounded-2xl py-5 px-4 items-center"
            onPress={handleRecordAttendance}
          >
            <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center mr-2 flex-shrink-0">
              <Utensils size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold mt-1">
              Record Attendance
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Insights Cards */}
      <View className="mt-6">
        {/* Attendance Breakdown Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center mb-3">
            <Calendar size={18} color="#10B981" />
            <Text className="text-base font-semibold text-gray-900 ml-2">
              Attendance Breakdown
            </Text>
          </View>
          <StatRow color="#22C55E" label="Present" value="33 days" />
          <StatRow color="#F59E0B" label="Late" value="1 days" />
          <StatRow color="#3B82F6" label="Excused" value="2 days" />
          <StatRow color="#9CA3AF" label="Absent" value="0 days" />
        </View>

        {/* Feeding Overview Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Utensils size={18} color="#10B981" />
            <Text className="text-base font-semibold text-gray-900 ml-2">
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

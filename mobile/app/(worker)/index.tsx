import {
  Users,
  UserCheck,
  UserX,
  Utensils,
  Calendar,
  Bell,
} from "lucide-react-native";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRecordAttendance = () => {
    router.push("./worker-record-data/attendance");
  };

  const handleRecordFeeding = () => {
    router.push("./worker-record-data/feeding");
  };

  return (
    <ScrollView
      className="flex-1 bg-teal-50 px-6"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-800">
          Worker Dashboard
        </Text>
        <Text className="text-base text-gray-500 mt-1">
          Today’s overview and quick actions
        </Text>
      </View>

      {/* Today Summary Card */}
      <View className="bg-teal-500 rounded-2xl p-5 mb-6">
        <Text className="text-white text-lg font-semibold">
          Today • {new Date().toDateString()}
        </Text>

        <View className="flex-row justify-between mt-4">
          <View className="items-center">
            <Users size={26} color="white" />
            <Text className="text-white text-lg font-bold mt-1">38</Text>
            <Text className="text-teal-200 text-sm">Total</Text>
          </View>

          <View className="items-center">
            <UserCheck size={26} color="white" />
            <Text className="text-white text-lg font-bold mt-1">35</Text>
            <Text className="text-teal-200 text-sm">Present</Text>
          </View>

          <View className="items-center">
            <UserX size={26} color="white" />
            <Text className="text-white text-lg font-bold mt-1">3</Text>
            <Text className="text-teal-200 text-sm">Absent</Text>
          </View>

          <View className="items-center">
            <Utensils size={26} color="white" />
            <Text className="text-white text-lg font-bold mt-1">32</Text>
            <Text className="text-teal-200 text-sm">Fed</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View>
        <Text className="text-xl font-bold text-gray-800">
          Quick Actions
        </Text>

        <View className="flex-row mt-4 gap-4">
          {/* Record Attendance */}
          <Pressable
            className="flex-1 flex-row bg-teal-500 rounded-2xl py-5 px-4 items-center"
            onPress={handleRecordAttendance}
          >
            <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center mr-3">
              <Calendar size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold">
              Record Attendance
            </Text>
          </Pressable>

          {/* Record Feeding */}
          <Pressable
            className="flex-1 flex-row bg-teal-500 rounded-2xl py-5 px-4 items-center"
            onPress={handleRecordFeeding}
          >
            <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center mr-3">
              <Utensils size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold">
              Record Lunch
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Notifications Preview */}
      <View className="mt-6 bg-white rounded-2xl p-5 border border-gray-100">
        <View className="flex-row items-center mb-3">
          <Bell size={18} color="#10B981" />
          <Text className="text-base font-semibold text-gray-900 ml-2">
            Reminders
          </Text>
        </View>

        <Text className="text-gray-600 text-sm">
          • Attendance not yet completed for today
        </Text>
        <Text className="text-gray-600 text-sm mt-1">
          • Lunch feeding starts at 11:30 AM
        </Text>
      </View>
    </ScrollView>
  );
}

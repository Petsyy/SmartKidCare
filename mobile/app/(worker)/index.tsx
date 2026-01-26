import { Users, UserCheck, UserX, Utensils, Calendar, MapPin, ReceiptText } from "lucide-react-native";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatRow, ProgressBar } from "../../src/components/helpers/dashboard-helpers";

export default function ParentDashboard() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleRecordFeeding = () => {
        router.push('./record/feeding');
    }

    const handleRecordAttendance = () => {
        router.push('./record/attendance');
    }

    return (
        <ScrollView 
            className="flex-1 bg-gray-50 px-6" 
            contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}>
            {/* Greeting Section */}
            <View className="mb-6">
                <Text className="text-3xl font-bold text-gray-800">Good Morning, Petsyy!</Text>
                <Text className="text-base text-gray-500 mt-1">Here&apos;s your overview for today</Text>
            </View>

            {/* Date and Location Card */}
            <View className="bg-green-300 rounded-3xl p-4 mb-6">
                <View className="flex-row items-center mb-2">
                    <Calendar size={20} color="#14B8A6" />
                    <Text className="text-base font-semibold text-gray-800 ml-2">Saturday, January 24, 2026</Text>
                </View>
                <View className="flex-row items-center">
                    <MapPin size={16} color="#14B8A6" />
                    <Text className="text-sm text-teal-600 ml-2">Bonuan Child Development Center</Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View className="flex-row flex-wrap">
                {/* Total Children - Blue */}
                <View className="w-1/2 p-2">
                    <View className="bg-blue-50 rounded-2xl p-4 flex-row items-center">
                        <View className="bg-blue-200 w-12 h-12 rounded-lg items-center justify-center mr-3 flex-shrink-0">
                            <Users size={24} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-3xl font-bold text-gray-800">6</Text>
                            <Text className="text-xs text-gray-500">Total Child...</Text>
                            <Text className="text-xs text-gray-400">Enrolled today</Text>
                        </View>
                    </View>
                </View>

                {/* Present - Green */}
                <View className="w-1/2 p-2">
                    <View className="bg-green-50 rounded-2xl p-4 flex-row items-center">
                        <View className="bg-green-200 w-12 h-12 rounded-lg items-center justify-center mr-3 flex-shrink-0">
                            <UserCheck size={24} color="#10B981" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-3xl font-bold text-gray-800">0</Text>
                            <Text className="text-xs text-gray-500">Present To...</Text>
                            <Text className="text-xs text-gray-400">6 pending</Text>
                        </View>
                    </View>
                </View>

                {/* Absent - Gray/Neutral */}
                <View className="w-1/2 p-2">
                    <View className="bg-gray-100 rounded-2xl p-4 flex-row items-center">
                        <View className="bg-gray-300 w-12 h-12 rounded-lg items-center justify-center mr-3 flex-shrink-0">
                            <UserX size={24} color="#6B7280" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-3xl font-bold text-gray-800">0</Text>
                            <Text className="text-xs text-gray-500">Absent To...</Text>
                            <Text className="text-xs text-gray-400">0 excused</Text>
                        </View>
                    </View>
                </View>

                {/* Feeding - Green */}
                <View className="w-1/2 p-2">
                    <View className="bg-green-50 rounded-2xl p-4 flex-row items-center">
                        <View className="bg-green-200 w-12 h-12 rounded-lg items-center justify-center mr-3 flex-shrink-0">
                            <Utensils size={24} color="#10B981" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-3xl font-bold text-gray-800">0</Text>
                            <Text className="text-xs text-gray-500">Feeding D...</Text>
                            <Text className="text-xs text-gray-400">6 pending</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            {/* Record Feeding Button */}
            <View>
                <Text className="text-lg font-bold text-gray-800 mt-4">Quick Actions</Text>
                <View className="flex-row mt-4 space-x-4 gap-4">
                    <Pressable className="flex-1 flex-row bg-green-200 rounded-2xl py-5 px-4 items-center" onPress={handleRecordFeeding}>
                        <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center mr-3 flex-shrink-0">
                            <ReceiptText size={24} color="white" />
                        </View>
                        <Text className="text-white text-base font-semibold mt-1">Record Feeding</Text>
                    </Pressable>
                    {/* Record Attendance Button */}
                    <Pressable className="flex-1 flex-row bg-green-200 rounded-2xl py-5 px-4 items-center" onPress={handleRecordAttendance}>
                        <View className="bg-teal-300 w-12 h-12 rounded-lg items-center justify-center mr-3 flex-shrink-0">
                            <Utensils size={24} color="white" />
                        </View>
                        <Text className="text-white text-base font-semibold mt-1">Record Attendance</Text>
                    </Pressable>
                </View>
            </View>

            {/* Insights Cards */}
            <View className="mt-6">
                {/* Attendance Breakdown Card */}
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
                    <View className="flex-row items-center mb-3">
                        <Calendar size={18} color="#10B981" />
                        <Text className="text-base font-semibold text-gray-900 ml-2">Attendance Breakdown</Text>
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
                        <Text className="text-base font-semibold text-gray-900 ml-2">Feeding Overview</Text>
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
    )
};


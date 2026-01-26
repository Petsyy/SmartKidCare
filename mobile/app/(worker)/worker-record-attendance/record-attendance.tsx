import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function RecordAttendance() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50 pt-16 pb-6 px-6">
            <View className="flex-row items-center mb-6">
                <Pressable onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#1F2937" />
                </Pressable>
                <Text className="text-2xl font-bold text-gray-800 ml-4">Record Attendance</Text>
            </View>
            <View className="items-center justify-center flex-1">
                <Text className="text-lg text-gray-600">Attendance record form coming soon</Text>
            </View>
        </View>
    )
}

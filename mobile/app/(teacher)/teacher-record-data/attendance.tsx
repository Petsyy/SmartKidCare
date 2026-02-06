import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function RecordAttendance() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50 pt-16 pb-6 px-6">
            <View className="flex-row items-center mb-6">
                <Pressable onPress={() => router.push('/(parent)')}>
                    <ChevronLeft size={24} color="#1F2937" />
                </Pressable>
                <Text className="text-2xl font-bold text-gray-800 ml-4">Record Attendance</Text>
            </View>
            <View className=' bg-gray-50 w-15 rounded-lg p-4 shadow'>

            </View>
        </View>
    )
}

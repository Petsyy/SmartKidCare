import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { getChildren } from '../../../src/api/teacher.api';
import type { Child } from '../../../src/api/parent.api';

export default function RecordAttendance() {
    const router = useRouter();
    const { token } = useAuth();
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                if (token) {
                    const data = await getChildren(token);
                    setChildren(data);
                    // Initialize attendance tracking
                    const initialAttendance: Record<string, boolean> = {};
                    data.forEach(child => {
                        initialAttendance[child._id] = false;
                    });
                    setAttendance(initialAttendance);
                }
            } catch (error) {
                console.error('Failed to fetch children:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChildren();
    }, [token]);

    const toggleAttendance = (childId: string) => {
        setAttendance(prev => ({
            ...prev,
            [childId]: !prev[childId]
        }));
    };

    const handleSubmit = () => {
        // Send attendance data to backend
        console.log('Attendance records:', attendance);
    };

    if (loading) return <ActivityIndicator size="large" className="flex-1 justify-center" />;

    return (
        <View className="flex-1 bg-gray-50 pt-16 pb-6 px-6">
            <View className="flex-row items-center mb-6">
                <Pressable onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#1F2937" />
                </Pressable>
                <Text className="text-2xl font-bold text-gray-800 ml-4">Record Attendance</Text>
            </View>

            <FlatList
                data={children}
                keyExtractor={child => child._id}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => toggleAttendance(item._id)}
                        className={`p-4 mb-3 rounded-lg ${attendance[item._id] ? 'bg-green-100' : 'bg-white'
                            } border border-gray-200`}
                    >
                        <Text className="text-lg font-semibold text-gray-800">
                            {item.firstName} {item.lastName}
                        </Text>
                        <Text className="text-sm text-gray-600">{item.studentId}</Text>
                        <Text className={`mt-2 font-bold ${attendance[item._id] ? 'text-green-600' : 'text-gray-400'
                            }`}>
                            {attendance[item._id] ? '✓ Present' : '○ Absent'}
                        </Text>
                    </Pressable>
                )}
            />

            <Pressable
                onPress={handleSubmit}
                className="bg-blue-600 p-4 rounded-lg mt-6"
            >
                <Text className="text-white text-center font-bold">Submit Attendance</Text>
            </Pressable>
        </View>
    )
}

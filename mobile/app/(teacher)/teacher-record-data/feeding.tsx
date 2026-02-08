import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check, X, ChevronDown, Search, CheckCircle, Lock, Calendar } from 'lucide-react-native';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { getChildren } from '@/src/api/teacher.api';
import { submitFeeding, getTodayFeeding, getTodayAttendance, type FeedingRecord } from '@/src/api/records.api';
import type { Child } from '@/src/api/parent.api';

const foodMenuOptions = [
    'Sinigang, Adobo',
    'Rice with Chicken Adobo',
    'Spaghetti with Meatballs',
    'Fried Rice with Vegetables',
    'Chicken Tinola',
    'Pork Sinigang',
    'Beef Caldereta',
    'Fish Fillet with Rice',
    'Pancit Canton',
    'Lumpia with Rice',
    'Other'
];

export default function RecordFeeding() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { token } = useAuth();
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedingStatus, setFeedingStatus] = useState<Record<string, boolean>>({});
    const [foodServed, setFoodServed] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [submittedAt, setSubmittedAt] = useState<string | null>(null);

    const presentChildrenIds = useMemo(() => {
        try {
            return params.presentChildren ? JSON.parse(params.presentChildren as string) : [];
        } catch {
            return [];
        }
    }, [params.presentChildren]);

    const attendanceDate = (params.attendanceDate as string) || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (token) {
                    // Fetch children and today's feeding record
                    const [childrenData, todayRecord] = await Promise.all([
                        getChildren(token),
                        getTodayFeeding(token)
                    ]);

                    // Determine which children to show
                    let childrenToShow: Child[] = [];

                    if (todayRecord) {
                        // Record already exists - show the children from that record
                        const recordedChildIds = todayRecord.records.map((r: any) => r.child._id || r.child);
                        childrenToShow = childrenData.filter(child => recordedChildIds.includes(child._id));

                        // Set read-only mode
                        setIsReadOnly(true);
                        setSubmittedAt(todayRecord.createdAt);
                        setFoodServed(todayRecord.foodServed);
                        
                        // Populate feeding status from existing record (inverted: false = completed, true = missed)
                        const existingStatus: Record<string, boolean> = {};
                        todayRecord.records.forEach((record: any) => {
                            existingStatus[record.child._id || record.child] = record.status !== 'completed';
                        });
                        setFeedingStatus(existingStatus);
                    } else {
                        // No record exists - check if we have present children IDs from attendance
                        if (presentChildrenIds.length > 0) {
                            childrenToShow = childrenData.filter(child => presentChildrenIds.includes(child._id));
                        } else {
                            // No present children IDs provided - fetch today's attendance to get them
                            const todayAttendance = await getTodayAttendance(token);
                            if (todayAttendance?.records) {
                                const presentIds = todayAttendance.records
                                    .filter((r: any) => r.status === 'present')
                                    .map((r: any) => r.child._id || r.child);
                                childrenToShow = childrenData.filter(child => presentIds.includes(child._id));
                            }
                        }

                        // Initialize feeding status (inverted: true = missed by default)
                        const initialStatus: Record<string, boolean> = {};
                        childrenToShow.forEach(child => {
                            initialStatus[child._id] = true;
                        });
                        setFeedingStatus(initialStatus);
                    }

                    setChildren(childrenToShow);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, presentChildrenIds]);

    const filteredChildren = useMemo(() => {
        return children.filter(child => {
            const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase()) ||
                child.studentId.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [children, searchQuery]);

    const stats = useMemo(() => {
        const missed = Object.values(feedingStatus).filter(Boolean).length;
        const fed = children.length - missed;
        return { fed, missed, total: children.length };
    }, [feedingStatus, children.length]);

    const toggleChildFeeding = (childId: string) => {
        setFeedingStatus(prev => ({
            ...prev,
            [childId]: !prev[childId]
        }));
    };

    const markAllAsFed = () => {
        const allFed: Record<string, boolean> = {};
        children.forEach(child => {
            allFed[child._id] = false;
        });
        setFeedingStatus(allFed);
    };

    const handleSubmit = async () => {
        // If read-only, just navigate back to dashboard
        if (isReadOnly) {
            router.push('/(teacher)');
            return;
        }

        // Validate authentication
        if (!token) {
            Alert.alert('Authentication Error', 'You must be logged in to submit feeding records.');
            return;
        }

        // Validate required fields
        if (!foodServed) {
            Alert.alert('Validation Error', 'Please select food served');
            return;
        }
        
        try {
            // Prepare feeding data (inverted back: false = completed, true = missed)
            const records: FeedingRecord[] = Object.entries(feedingStatus).map(([childId, isMissed]) => ({
                child: childId,
                status: !isMissed ? 'completed' as const : 'missed' as const
            }));

            // Submit to backend
            await submitFeeding(token, {
                date: attendanceDate,
                foodServed,
                records
            });

            // Navigate back to dashboard on success
            router.push('/(teacher)');
        } catch (error) {
            Alert.alert('Submission Error', 'Failed to submit feeding records. Please try again.');
            console.error('Feeding submission error:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#14B8A6" />
                <Text className="mt-4 text-gray-600">Loading children...</Text>
            </SafeAreaView>
        );
    }

    if (children.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="bg-white px-6 pt-4 pb-3">
                    <Pressable onPress={() => router.back()}>
                        <ChevronLeft size={24} color="#1F2937" />
                    </Pressable>
                </View>
                <View className="flex-1 items-center justify-center px-6">
                    <CheckCircle size={64} color="#D1D5DB" />
                    <Text className="text-xl font-bold text-gray-800 mt-4">No Present Children</Text>
                    <Text className="text-center text-gray-600 mt-2">Please mark attendance first to record feeding.</Text>
                    <Pressable
                        onPress={() => router.back()}
                        className="mt-6 bg-teal-600 px-6 py-3 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Back to Attendance</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="bg-white px-6 pt-4 pb-4 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <Pressable onPress={() => router.back()} className="mr-3">
                            <ChevronLeft size={24} color="#1F2937" />
                        </Pressable>
                        <Text className="text-2xl font-bold text-gray-800">Record Feeding</Text>
                    </View>

                    {/* Date Display */}
                    <View className="bg-teal-50 px-4 py-3 rounded-xl border border-teal-200">
                        <View className="flex-row items-center">
                            <View className="w-9 h-9 bg-teal-500 rounded-full items-center justify-center mr-3">
                                <Calendar size={18} color="white" />
                            </View>
                            <View>
                                <Text className="text-xs font-semibold text-teal-700 uppercase">Date</Text>
                                <Text className="text-base font-bold text-gray-900">{attendanceDate}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Read-Only Banner */}
                    {isReadOnly && (
                        <View className="mt-3 bg-teal-50 border-2 border-teal-300 rounded-lg p-4 flex-row items-center">
                            <CheckCircle size={24} color="#14B8A6" />
                            <View className="flex-1 ml-3">
                                <Text className="text-base font-bold text-teal-800">Successfully Submitted</Text>
                                <Text className="text-sm text-teal-700 mt-1">Attendance and feeding for today were successfully submitted.</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View className="px-6 pb-32">
                    {/* Info Box */}
                    <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <View className="flex-row items-start mb-2">
                            <Check size={16} color="#10B981" className="mt-0.5" />
                            <Text className="ml-2 text-base text-gray-800 flex-1">
                                <Text className="font-semibold">Completed</Text> - child consumed the lunch meal as observed by the teacher
                            </Text>
                        </View>
                        <View className="flex-row items-start">
                            <X size={16} color="#EF4444" className="mt-0.5" />
                            <Text className="ml-2 text-base text-gray-800 flex-1">
                                <Text className="font-semibold">Missed</Text> - child did not eat, refused food, or was not present during lunch
                            </Text>
                        </View>
                    </View>

                    {/* Food Served */}
                    <View className="mb-4">
                        <Text className="text-base font-medium text-gray-700 mb-2">
                            Food Served (Menu) <Text className="text-red-500">*</Text>
                        </Text>
                        <Pressable
                            onPress={() => !isReadOnly && setShowMenuModal(true)}
                            disabled={isReadOnly}
                            className={`flex-row items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 ${isReadOnly ? 'opacity-75' : ''}`}
                        >
                            <Text className={`text-base ${foodServed ? 'text-gray-800' : 'text-gray-400'}`}>
                                {foodServed || 'Select food menu'}
                            </Text>
                            {!isReadOnly && <ChevronDown size={20} color="#9CA3AF" />}
                        </Pressable>
                    </View>

                    {/* Stats */}
                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1 bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100">
                            <View className="flex-row items-center">
                                <CheckCircle size={20} color="#14B8A6" />
                                <Text className="ml-2 text-sm text-teal-700">Fed</Text>
                            </View>
                            <Text className="text-2xl font-bold text-teal-700 mt-1">{stats.fed}</Text>
                        </View>

                        <View className="flex-1 bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                            <View className="flex-row items-center">
                                <X size={20} color="#EF4444" />
                                <Text className="ml-2 text-sm text-red-700">Missed</Text>
                            </View>
                            <Text className="text-2xl font-bold text-red-700 mt-1">{stats.missed}</Text>
                        </View>
                    </View>

                    {/* Search */}
                    <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-4 py-3 mb-3">
                        <Search size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-3 text-base text-gray-800"
                            placeholder="Search child name"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Info Text & Mark All Button */}
                    {!isReadOnly && (
                        <View className="mb-3">
                            <Pressable
                                onPress={markAllAsFed}
                                className="flex-row items-center justify-center bg-teal-500 px-4 py-3 rounded-lg"
                            >
                                <CheckCircle size={18} color="white" />
                                <Text className="ml-2 text-white text-base font-semibold">Mark All as Completed</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Children List */}
                    {filteredChildren.map((child) => (
                        <Pressable
                            key={child._id}
                            onPress={() => !isReadOnly && toggleChildFeeding(child._id)}
                            disabled={isReadOnly}
                            className={`mb-3 rounded-xl overflow-hidden border-2 ${!feedingStatus[child._id]
                                ? 'bg-teal-50 border-teal-400'
                                : 'bg-white border-gray-200'
                                } ${isReadOnly ? 'opacity-90' : ''}`}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                            }}
                        >
                            <View className="flex-row items-center p-4">
                                {/* Avatar */}
                                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${!feedingStatus[child._id] ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                    <Text className="text-white font-bold text-lg">
                                        {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                                    </Text>
                                </View>

                                {/* Child Info */}
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Text className="text-lg font-bold text-gray-800">
                                            {child.firstName} {child.lastName}
                                        </Text>
                                    </View>
                                    <Text className="text-sm text-gray-600 mt-0.5">{child.studentId || `${child.age} years old • ${child.gender}`}</Text>
                                </View>

                                {/* Status */}
                                <View>
                                    {!feedingStatus[child._id] ? (
                                        <View className="items-center">
                                            <CheckCircle size={32} color="#14B8A6" />
                                            <Text className="text-teal-600 font-bold text-sm mt-1">Completed</Text>
                                        </View>
                                    ) : (
                                        <View className="items-center">
                                            <X size={32} color="#9CA3AF" />
                                            <Text className="text-gray-500 font-medium text-sm mt-1">Missed</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    ))}

                    {/* Bottom Info */}
                    <View className="flex-row items-start bg-teal-50 border border-teal-200 rounded-lg p-3 mt-2">
                        <CheckCircle size={16} color="#14B8A6" className="mt-0.5" />
                        <Text className="ml-2 text-sm text-gray-700 flex-1">
                            Feeding records are teacher-observed, teacher-confirmed, and securely stored
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Food Menu Modal */}
            <Modal
                visible={showMenuModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMenuModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl">
                        <View className="p-6 border-b border-gray-200">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xl font-bold text-gray-800">Select Food Menu</Text>
                                <Pressable onPress={() => setShowMenuModal(false)}>
                                    <Text className="text-teal-600 font-semibold text-base">Close</Text>
                                </Pressable>
                            </View>
                        </View>
                        <View className="max-h-96">
                            <FlatList
                                data={foodMenuOptions}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item: food }) => (
                                    <Pressable
                                        onPress={() => {
                                            setFoodServed(food);
                                            setShowMenuModal(false);
                                        }}
                                        className="px-6 py-4 border-b border-gray-100 active:bg-gray-50"
                                    >
                                        <Text className="text-base text-gray-800">{food}</Text>
                                    </Pressable>
                                )}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Submit Button */}
            <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200">
                <Pressable
                    onPress={handleSubmit}
                    className="bg-teal-600 py-4 rounded-xl items-center justify-center"
                    style={{
                        shadowColor: '#14B8A6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5,
                    }}
                >
                    <Text className="text-white text-lg font-bold">
                        {isReadOnly ? 'Back to Dashboard' : 'Save Feeding'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

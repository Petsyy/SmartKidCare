import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Calendar, CheckCircle2, XCircle, Users, Lock } from 'lucide-react-native';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { getChildren } from '@/src/api/teacher.api';
import { submitAttendance, getTodayAttendance } from '@/src/api/records.api';
import type { Child } from '@/src/api/parent.api';

export default function RecordAttendance() {
    const router = useRouter();
    const { token } = useAuth();
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [submittedAt, setSubmittedAt] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (token) {
                    // Fetch children and today's attendance record in parallel
                    const [childrenData, todayRecord] = await Promise.all([
                        getChildren(token),
                        getTodayAttendance(token)
                    ]);

                    setChildren(childrenData);

                    if (todayRecord) {
                        // Record already exists for today - show read-only view
                        setIsReadOnly(true);
                        setSubmittedAt(todayRecord.createdAt);
                        
                        // Populate attendance from existing record
                        const existingAttendance: Record<string, boolean> = {};
                        todayRecord.records.forEach((record: any) => {
                            existingAttendance[record.child._id || record.child] = record.status === 'present';
                        });
                        setAttendance(existingAttendance);
                    } else {
                        // No record exists - initialize for editable form
                        const initialAttendance: Record<string, boolean> = {};
                        childrenData.forEach(child => {
                            initialAttendance[child._id] = false;
                        });
                        setAttendance(initialAttendance);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const filteredChildren = useMemo(() => {
        return children.filter(child => {
            const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase()) ||
                child.studentId.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [children, searchQuery]);

    const stats = useMemo(() => {
        const present = Object.values(attendance).filter(Boolean).length;
        const absent = children.length - present;
        return { present, absent, total: children.length };
    }, [attendance, children.length]);

    const toggleAttendance = (childId: string) => {
        setAttendance(prev => ({
            ...prev,
            [childId]: !prev[childId]
        }));
    };

    const markAllPresent = () => {
        const allPresent: Record<string, boolean> = {};
        children.forEach(child => {
            allPresent[child._id] = true;
        });
        setAttendance(allPresent);
    };

    const markAllAbsent = () => {
        const allAbsent: Record<string, boolean> = {};
        children.forEach(child => {
            allAbsent[child._id] = false;
        });
        setAttendance(allAbsent);
    };

    const handleSubmit = async () => {
        try {
            if (!token) {
                Alert.alert('Error', 'Not authenticated');
                return;
            }

            // Get present children IDs
            const presentChildrenIds = Object.entries(attendance)
                .filter(([_, isPresent]) => isPresent)
                .map(([childId]) => childId);

            // If read-only, just navigate to feeding record
            if (isReadOnly) {
                router.push({
                    pathname: '/(teacher)/teacher-record-data/feeding',
                    params: {
                        presentChildren: JSON.stringify(presentChildrenIds),
                        attendanceDate: selectedDate
                    }
                });
                return;
            }

            // Prepare attendance records
            const records = Object.entries(attendance).map(([childId, isPresent]) => ({
                child: childId,
                status: isPresent ? 'present' as const : 'absent' as const
            }));

            // Submit to backend
            await submitAttendance(token, {
                date: new Date().toISOString(),
                records
            });

            // Navigate to feeding with present children
            router.push({
                pathname: '/(teacher)/teacher-record-data/feeding',
                params: {
                    presentChildren: JSON.stringify(presentChildrenIds),
                    attendanceDate: selectedDate
                }
            });
        } catch (error: any) {
            console.error('Failed to submit attendance:', error);
            Alert.alert('Error', error.message || 'Failed to submit attendance');
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

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white pt-4 pb-4 px-6 shadow-sm">
                <View className="flex-row items-center mb-3">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <ChevronLeft size={24} color="#1F2937" />
                    </Pressable>
                    <Text className="text-2xl font-bold text-gray-800">Record Attendance</Text>
                </View>

                {/* Date Display */}
                <View className="bg-teal-50 px-4 py-3 rounded-xl border border-teal-200">
                    <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-teal-500 rounded-full items-center justify-center mr-3">
                            <Calendar size={18} color="white" />
                        </View>
                        <View>
                            <Text className="text-xs font-semibold text-teal-700 uppercase">Date</Text>
                            <Text className="text-base font-bold text-gray-900">{selectedDate}</Text>
                        </View>
                    </View>
                </View>

                {/* Read-Only Banner */}
                {isReadOnly && (
                    <View className="mt-3 bg-teal-50 border-2 border-teal-300 rounded-lg p-4 flex-row items-center">
                        <CheckCircle2 size={24} color="#14B8A6" />
                        <View className="flex-1 ml-3">
                            <Text className="text-base font-bold text-teal-800">Successfully Submitted</Text>
                            <Text className="text-sm text-teal-700 mt-1">Attendance and feeding for today were successfully submitted.</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Stats Cards */}
            <View className="px-6 py-4">
                <View className="flex-row justify-between gap-3">
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <View className="flex-row items-center">
                            <Users size={20} color="#6B7280" />
                            <Text className="ml-2 text-sm text-gray-600">Total</Text>
                        </View>
                        <Text className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</Text>
                    </View>

                    <View className="flex-1 bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100">
                        <View className="flex-row items-center">
                            <CheckCircle2 size={20} color="#14B8A6" />
                            <Text className="ml-2 text-sm text-teal-700">Present</Text>
                        </View>
                        <Text className="text-2xl font-bold text-teal-700 mt-1">{stats.present}</Text>
                    </View>

                    <View className="flex-1 bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                        <View className="flex-row items-center">
                            <XCircle size={20} color="#EF4444" />
                            <Text className="ml-2 text-sm text-red-700">Absent</Text>
                        </View>
                        <Text className="text-2xl font-bold text-red-700 mt-1">{stats.absent}</Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            {!isReadOnly && (
                <View className="px-6 pb-3">
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={markAllPresent}
                            className="flex-1 bg-teal-500 py-3 rounded-lg flex-row items-center justify-center"
                        >
                            <CheckCircle2 size={18} color="white" />
                            <Text className="text-white font-semibold ml-2">Mark All Present</Text>
                        </Pressable>

                        <Pressable
                            onPress={markAllAbsent}
                            className="flex-1 bg-gray-500 py-3 rounded-lg flex-row items-center justify-center"
                        >
                            <XCircle size={18} color="white" />
                            <Text className="text-white font-semibold ml-2">Mark All Absent</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* Search Bar */}
            <View className="px-6 pb-4">
                <View className="flex-row items-center bg-white px-4 py-3 rounded-lg border border-gray-200">
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Search by name or student ID..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Children List */}
            <FlatList
                data={filteredChildren}
                keyExtractor={child => child._id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-12">
                        <Users size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 mt-4 text-center">
                            {searchQuery ? 'No children found matching your search' : 'No children enrolled yet'}
                        </Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <Pressable
                        onPress={() => !isReadOnly && toggleAttendance(item._id)}
                        disabled={isReadOnly}
                        className={`mb-3 rounded-xl overflow-hidden border-2 ${attendance[item._id]
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
                            {/* Avatar Circle */}
                            <View className={`w-12 h-12 rounded-full items-center justify-center ${attendance[item._id] ? 'bg-teal-500' : 'bg-gray-300'
                                }`}>
                                <Text className="text-white font-bold text-lg">
                                    {item.firstName.charAt(0)}{item.lastName.charAt(0)}
                                </Text>
                            </View>

                            {/* Child Info */}
                            <View className="flex-1 ml-4">
                                <Text className="text-lg font-bold text-gray-800">
                                    {item.firstName} {item.lastName}
                                </Text>
                                <Text className="text-sm text-gray-600 mt-0.5">{item.studentId}</Text>
                            </View>

                            {/* Status Icon */}
                            <View>
                                {attendance[item._id] ? (
                                    <View className="items-center">
                                        <CheckCircle2 size={32} color="#14B8A6" />
                                        <Text className="text-teal-600 font-bold text-sm mt-1">Present</Text>
                                    </View>
                                ) : (
                                    <View className="items-center">
                                        <XCircle size={32} color="#9CA3AF" />
                                        <Text className="text-gray-500 font-medium text-sm mt-1">Absent</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Pressable>
                )}
            />

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
                        {isReadOnly ? 'View Feeding Record' : 'Submit Attendance'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

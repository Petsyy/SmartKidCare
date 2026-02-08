import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyChildren, Child } from '@/src/api/parent.api';

type AttendanceStatus = 'Present' | 'Absent' | null;

interface AttendanceDay {
    day: number;
    status: AttendanceStatus;
}

export default function ViewAttendanceDetails() {
    const router = useRouter();
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [loading, setLoading] = useState(true);
    const [showChildDropdown, setShowChildDropdown] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date(2026, 1)); // February 2026

    // Mock attendance data - this would come from API in real implementation
    const [attendanceData, setAttendanceData] = useState<AttendanceDay[]>([
        { day: 2, status: 'Present' },
        { day: 3, status: 'Present' },
        { day: 4, status: 'Present' },
        { day: 8, status: 'Present' },
        { day: 10, status: 'Absent' },
    ]);

    useEffect(() => {
        loadChildren();
    }, []);

    const loadChildren = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('No authentication token');

            const data = await getMyChildren(token);
            setChildren(data);
            if (data.length > 0) {
                setSelectedChild(data[0]);
            }
        } catch (err: any) {
            console.error('Failed to load children:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        return { daysInMonth, firstDayOfMonth };
    };

    const getMonthName = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getStatusForDay = (day: number): AttendanceStatus => {
        const dayData = attendanceData.find(d => d.day === day);
        return dayData ? dayData.status : null;
    };

    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case 'Present': return 'bg-green-500';
            case 'Absent': return 'bg-red-500';
            default: return 'bg-transparent';
        }
    };

    const calculateMonthlySummary = () => {
        const summary = {
            present: 0,
            absent: 0,
        };

        attendanceData.forEach(day => {
            if (day.status === 'Present') summary.present++;
            else if (day.status === 'Absent') summary.absent++;
        });

        return summary;
    };

    const calculateAttendanceRate = () => {
        const summary = calculateMonthlySummary();
        const total = summary.present + summary.absent;
        if (total === 0) return 0;
        return Math.round((summary.present / total) * 100);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    const renderCalendar = () => {
        const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Day names header
        const dayHeaders = dayNames.map((name, index) => (
            <View key={`header-${index}`} className="w-[14.28%] items-center py-2">
                <Text className="text-sm font-semibold text-gray-600">{name}</Text>
            </View>
        ));

        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<View key={`empty-${i}`} className="w-[14.28%] p-2" />);
        }

        // Calendar days
        for (let day = 1; day <= daysInMonth; day++) {
            const status = getStatusForDay(day);
            const isToday = day === 8; // Highlighting day 8 as shown in image

            days.push(
                <View key={`day-${day}`} className="w-[14.28%] p-2">
                    <View className={`items-center justify-center h-10 rounded-full ${isToday ? 'border-2 border-teal-500' : ''}`}>
                        <Text className={`text-base ${isToday ? 'font-bold text-teal-600' : 'text-gray-700'}`}>
                            {day}
                        </Text>
                        {status && (
                            <View className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getStatusColor(status)}`} />
                        )}
                    </View>
                </View>
            );
        }

        return (
            <View>
                <View className="flex-row flex-wrap">
                    {dayHeaders}
                </View>
                <View className="flex-row flex-wrap">
                    {days}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#0d9488" />
            </View>
        );
    }

    const summary = calculateMonthlySummary();
    const attendanceRate = calculateAttendanceRate();

    return (
        <View className="flex-1 bg-gray-50">
            {/* Fixed Teal Header */}
            <View className="bg-teal-600 pt-12 pb-8 px-6">
                <View className="flex-row items-start">
                    <Pressable onPress={() => router.push('/(parent)')} className="mr-4 mt-1">
                        <ChevronLeft size={24} color="white" />
                    </Pressable>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-white">View Record Details</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 24, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Attendance Subheader */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-700">Attendance</Text>
                    <Text className="text-base text-gray-500 mt-1">View your child's daily attendance records</Text>
                </View>

                {/* Child Selector */}
                <View className="mb-6">
                    <Pressable
                        onPress={() => setShowChildDropdown(!showChildDropdown)}
                        className="bg-white rounded-xl p-4 flex-row items-center justify-between border border-gray-200"
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="w-10 h-10 rounded-full bg-teal-500 items-center justify-center mr-3">
                                <Text className="text-white font-semibold text-lg">
                                    {selectedChild?.firstName.charAt(0)}
                                </Text>
                            </View>
                            <Text className="text-lg font-medium text-gray-800">
                                {selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'Select Child'}
                            </Text>
                        </View>
                        <ChevronDown size={20} color="#6B7280" />
                    </Pressable>

                    {/* Dropdown Menu */}
                    {showChildDropdown && children.length > 1 && (
                        <View className="bg-white rounded-xl mt-2 border border-gray-200 overflow-hidden">
                            {children.map((child, index) => (
                                <Pressable
                                    key={child._id}
                                    onPress={() => {
                                        setSelectedChild(child);
                                        setShowChildDropdown(false);
                                    }}
                                    className={`p-4 flex-row items-center ${index !== children.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <View className="w-10 h-10 rounded-full bg-teal-500 items-center justify-center mr-3">
                                        <Text className="text-white font-semibold text-lg">
                                            {child.firstName.charAt(0)}
                                        </Text>
                                    </View>
                                    <Text className="text-lg text-gray-800">
                                        {child.firstName} {child.lastName}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>

                {/* Calendar Card */}
                <View className="bg-white rounded-xl p-5 mb-6 border border-gray-200">
                    {/* Month Navigation */}
                    <View className="flex-row items-center justify-between mb-4">
                        <Pressable onPress={() => navigateMonth('prev')} className="p-2">
                            <ChevronLeft size={20} color="#6B7280" />
                        </Pressable>
                        <Text className="text-lg font-semibold text-gray-800">
                            {getMonthName(currentDate)}
                        </Text>
                        <Pressable onPress={() => navigateMonth('next')} className="p-2">
                            <ChevronRight size={20} color="#6B7280" />
                        </Pressable>
                    </View>

                    {/* Calendar Grid */}
                    {renderCalendar()}

                    {/* Legend */}
                    <View className="mt-6 pt-4 border-t border-gray-100">
                        <View className="flex-row flex-wrap">
                            <View className="flex-row items-center mr-4 mb-2">
                                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                <Text className="text-sm text-gray-600">Present</Text>
                            </View>
                            <View className="flex-row items-center mb-2">
                                <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                <Text className="text-sm text-gray-600">Absent</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Monthly Summary */}
                <View className="bg-white rounded-xl p-5 mb-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-gray-800 mb-4">Monthly Summary</Text>
                    <View className="flex-row flex-wrap">
                        <View className="w-[48%] mr-[4%] mb-4">
                            <View className="bg-green-50 rounded-lg p-4 items-center">
                                <Text className="text-3xl font-bold text-green-700">{summary.present}</Text>
                                <Text className="text-base text-green-600 mt-1">Present</Text>
                            </View>
                        </View>
                        <View className="w-[48%]">
                            <View className="bg-red-50 rounded-lg p-4 items-center">
                                <Text className="text-3xl font-bold text-red-700">{summary.absent}</Text>
                                <Text className="text-base text-red-600 mt-1">Absent</Text>
                            </View>
                        </View>
                    </View>

                    {/* Overall Attendance Rate */}
                    <View className="mt-6 pt-4 border-t border-gray-100">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-base font-medium text-gray-700">Overall Attendance Rate</Text>
                            <Text className="text-2xl font-bold text-green-600">{attendanceRate}%</Text>
                        </View>
                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${attendanceRate}%` }}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

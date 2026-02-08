import { useEffect, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getChildById, type Child } from "@/src/api/parent.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import { useAuth } from "@/src/hooks/useAuth";
import { ChevronLeft, User, Mail, Phone, Calendar, BookOpen, Activity } from "lucide-react-native";

export default function ChildDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [feedingRecord, setFeedingRecord] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!token || !id) throw new Error("Missing required data");

        console.log("Loading child details for ID:", id);
        console.log("Token available:", !!token);

        // Fetch child details and today's records in parallel
        const [childData, attendance, feeding] = await Promise.all([
          getChildById(token, id as string).catch((err) => {
            console.error("Failed to fetch child details:", err);
            throw new Error(`Failed to fetch child: ${err.message}`);
          }),
          getTodayAttendance(token).catch((err) => {
            console.warn("Failed to fetch attendance:", err);
            return null;
          }),
          getTodayFeeding(token).catch((err) => {
            console.warn("Failed to fetch feeding:", err);
            return null;
          }),
        ]);

        setChild(childData);
        setAttendanceRecord(attendance);
        setFeedingRecord(feeding);
      } catch (err: any) {
        console.error("Load data error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, id]);

  // Get status for this child
  const getChildStatus = () => {
    if (!child) return { attendance: "Not Recorded", feeding: "Not Recorded" };

    let attendance = "Not Recorded";
    let feeding = "Not Recorded";

    // Check attendance
    if (attendanceRecord?.records) {
      const attendanceEntry = attendanceRecord.records.find(
        (r: any) => (r.child._id || r.child) === child._id
      );
      if (attendanceEntry) {
        attendance = attendanceEntry.status === "present" ? "Present" : "Absent";
      }
    }

    // Check feeding
    if (feedingRecord?.records) {
      const feedingEntry = feedingRecord.records.find(
        (r: any) => (r.child._id || r.child) === child._id
      );
      if (feedingEntry) {
        feeding = feedingEntry.status === "completed" ? "Fed" : "Missed";
      }
    }

    return { attendance, feeding };
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="mt-4 text-gray-600">Loading child details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !child) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center">{error || "Child not found"}</Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 bg-teal-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const status = getChildStatus();
  const fullName = `${child.firstName} ${child.middleName ? child.middleName + " " : ""}${child.lastName}`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-6"
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="white" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">
              {fullName}
            </Text>
            <Text className="text-lg text-teal-100 mt-1">
              Student ID: {child.studentId}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5 space-y-4">
          {/* Today's Status Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-green-500 mb-5">
            <View className="flex-row items-center mb-4">
              <Activity size={24} color="#14B8A6" />
              <Text className="text-xl font-bold text-gray-800 ml-2">Today's Status</Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-base text-gray-600">Attendance:</Text>
                <View className={`px-3 py-1 rounded-lg ${
                  status.attendance === "Present" ? "bg-green-100" :
                  status.attendance === "Absent" ? "bg-red-100" : "bg-gray-100"
                }`}>
                  <Text className={`text-base font-semibold ${
                    status.attendance === "Present" ? "text-green-700" :
                    status.attendance === "Absent" ? "text-red-700" : "text-gray-700"
                  }`}>
                    {status.attendance}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-gray-200" />

              <View className="flex-row justify-between items-center py-2">
                <Text className="text-base text-gray-600">Feeding:</Text>
                <View className={`px-3 py-1 rounded-lg ${
                  status.feeding === "Fed" ? "bg-green-100" :
                  status.feeding === "Missed" ? "bg-red-100" : "bg-gray-100"
                }`}>
                  <Text className={`text-base font-semibold ${
                    status.feeding === "Fed" ? "text-green-700" :
                    status.feeding === "Missed" ? "text-red-700" : "text-gray-700"
                  }`}>
                    {status.feeding}
                  </Text>
                </View>
              </View>

              {feedingRecord && (
                <>
                  <View className="h-px bg-gray-200" />
                  <View className="py-2">
                    <Text className="text-sm text-gray-500 mb-1">Today's Menu:</Text>
                    <Text className="text-base font-semibold text-gray-800">
                      {feedingRecord.foodServed || "Not specified"}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Child Information Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-green-500 mb-5">
            <View className="flex-row items-center mb-4">
              <User size={24} color="#14B8A6" />
              <Text className="text-xl font-bold text-gray-800 ml-2">Child Information</Text>
            </View>

            <View className="flex-row flex-wrap">
              <View className="w-1/2 pr-2 mb-4">
                <InfoRow icon={<BookOpen size={20} color="#6B7280" />} label="Age" value={`${child.age} years old`} />
              </View>
              <View className="w-1/2 pl-2 mb-4">
                <InfoRow icon={<User size={20} color="#6B7280" />} label="Gender" value={child.gender} />
              </View>
              <View className="w-1/2 pr-2 mb-4">
                <InfoRow icon={<Calendar size={20} color="#6B7280" />} label="School Year" value={child.schoolYear} />
              </View>
              <View className="w-1/2 pl-2 mb-4">
                <InfoRow icon={<Activity size={20} color="#6B7280" />} label="Status" value={child.status} />
              </View>
              {child.dateOfBirth && (
                <View className="w-1/2 pr-2 mb-4">
                  <InfoRow 
                    icon={<Calendar size={20} color="#6B7280" />} 
                    label="Date of Birth" 
                    value={new Date(child.dateOfBirth).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} 
                  />
                </View>
              )}
              <View className="w-1/2 pl-2 mb-4">
                <InfoRow 
                  icon={<Calendar size={20} color="#6B7280" />} 
                  label="Enrollment Date" 
                  value={new Date(child.enrollmentDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} 
                />
              </View>
            </View>
          </View>

          {/* Parent Information Card */}
          {child.parent ? (
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-green-500 mb-5">
              <View className="flex-row items-center mb-4">
                <User size={24} color="#14B8A6" />
                <Text className="text-xl font-bold text-gray-800 ml-2">Parent Information</Text>
              </View>

              <View className="space-y-3">
                <InfoRow 
                  icon={<User size={20} color="#6B7280" />} 
                  label="Name" 
                  value={`${child.parent.firstName} ${child.parent.lastName}`} 
                />
                <InfoRow 
                  icon={<Mail size={20} color="#6B7280" />} 
                  label="Email" 
                  value={child.parent.email} 
                />
                {child.parent.phoneNumber && (
                  <InfoRow 
                    icon={<Phone size={20} color="#6B7280" />} 
                    label="Phone" 
                    value={child.parent.phoneNumber} 
                  />
                )}
              </View>
            </View>
          ) : (
            <View className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
              <View className="flex-row items-center">
                <User size={24} color="#F59E0B" />
                <View className="flex-1 ml-3">
                  <Text className="text-lg font-semibold text-amber-800">No Parent Linked</Text>
                  <Text className="text-sm text-amber-700 mt-1">
                    This child has not been linked to a parent account yet.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center py-2">
      <View className="mr-3">{icon}</View>
      <View className="flex-1">
        <Text className="text-sm text-gray-500 mb-0.5">{label}</Text>
        <Text className="text-base font-semibold text-gray-800">{value}</Text>
      </View>
    </View>
  );
}

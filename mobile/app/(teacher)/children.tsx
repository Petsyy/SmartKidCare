import { useEffect, useState, useMemo } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Child } from "@/src/api/parent.api";
import { getChildren } from "@/src/api/teacher.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import { useAuth } from "@/src/hooks/useAuth";
import ChildCard from "@/src/components/ChildCard";
import { Search, X, Users, UserPlus, AlertCircle } from "lucide-react-native";

interface ChildStatus {
  attendance: "Present" | "Absent" | "Not Recorded";
  feeding: "Finished" | "Missed" | "Not Recorded";
  lastUpdated: string;
}

export default function ChildScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [feedingRecord, setFeedingRecord] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!token) throw new Error("No authentication token");

        // Fetch children and today's records in parallel
        const [childrenData, attendance, feeding] = await Promise.all([
          getChildren(token),
          getTodayAttendance(token).catch(() => null),
          getTodayFeeding(token).catch(() => null),
        ]);

        setChildren(childrenData);
        setAttendanceRecord(attendance);
        setFeedingRecord(feeding);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, refreshKey]);

  // Get status for a specific child
  const getChildStatus = (childId: string): ChildStatus => {
    let attendance: "Present" | "Absent" | "Not Recorded" = "Not Recorded";
    let feeding: "Finished" | "Missed" | "Not Recorded" = "Not Recorded";
    let lastUpdated = "No data";

    // Check attendance
    if (attendanceRecord?.records) {
      const attendanceEntry = attendanceRecord.records.find(
        (r: any) => (r.child._id || r.child) === childId
      );
      if (attendanceEntry) {
        attendance = attendanceEntry.status === "present" ? "Present" : "Absent";
        lastUpdated = new Date(attendanceRecord.createdAt).toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Manila",
        });
      }
    }

    // Check feeding
    if (feedingRecord?.records) {
      const feedingEntry = feedingRecord.records.find(
        (r: any) => (r.child._id || r.child) === childId
      );
      if (feedingEntry) {
        feeding = feedingEntry.status === "completed" ? "Finished" : "Missed";
      }
    }

    return { attendance, feeding, lastUpdated };
  };

  // Filter children based on search query
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return children;

    const query = searchQuery.toLowerCase();
    return children.filter((child) => {
      const fullName = `${child.firstName} ${child.middleName || ""} ${child.lastName}`.toLowerCase();
      const studentId = child.studentId.toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
    });
  }, [children, searchQuery]);


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center mb-4">
            <Users size={40} color="#14B8A6" />
          </View>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="mt-4 text-lg text-gray-600 font-medium">Loading children...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-6">
            <AlertCircle size={48} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
            Oops! Something Went Wrong
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-6">
            {error}
          </Text>
          <Pressable
            onPress={retryLoad}
            className="bg-teal-600 px-8 py-4 rounded-xl"
            style={{
              shadowColor: '#14B8A6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <Text className="text-3xl font-extrabold text-white">
          Children List
        </Text>
        <Text className="text-lg text-teal-100 mt-1">
          {children.length} Enrolled Children
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 pt-4 pb-2 bg-gray-50">
        <View className="flex-row items-center bg-white rounded-lg px-4 py-3 border border-gray-200">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-lg text-gray-800"
            placeholder="Search by name or student ID..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* LIST */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-2">
          {filteredChildren.length === 0 ? (
            <View className="items-center justify-center py-16 px-6">
              {searchQuery ? (
                <>
                  {/* No Search Results */}
                  <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-6">
                    <AlertCircle size={48} color="#9CA3AF" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
                    No Children Found
                  </Text>
                  <Text className="text-lg text-gray-600 text-center mb-6 leading-6">
                    No children match your search.{"\n"}
                    Try a different search term.
                  </Text>
                </>
              ) : (
                <>
                  {/* Empty State */}
                  <View className="w-32 h-32 rounded-full bg-teal-50 items-center justify-center mb-6">
                    <Users size={64} color="#14B8A6" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
                    No Children Enrolled Yet
                  </Text>
                  <Text className="text-lg text-gray-600 text-center mb-8 leading-6">
                    There are currently no children enrolled in your class.{"\n"}
                    Children will appear here once they are added by the admin.
                  </Text>

                  {/* Info Cards */}
                  <View className="w-full space-y-3">
                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex-row items-start">
                      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <UserPlus size={20} color="#3B82F6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-blue-900 mb-1">
                          Waiting for Enrollment
                        </Text>
                        <Text className="text-base text-blue-700">
                          Contact your administrator to add children to your class roster.
                        </Text>
                      </View>
                    </View>

                    <View className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex-row items-start">
                      <View className="w-10 h-10 rounded-full bg-teal-100 items-center justify-center mr-3">
                        <Users size={20} color="#14B8A6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-teal-900 mb-1">
                          What You Can Do
                        </Text>
                        <Text className="text-base text-teal-700">
                          Once children are enrolled, you'll be able to record attendance, feeding, and view their details.
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          ) : (
            <View className="flex flex-col">
              {filteredChildren.map((child, index) => {
                const status = getChildStatus(child._id);
                return (
                  <View key={child._id} className={index < filteredChildren.length - 1 ? "mb-4" : ""}>
                    <ChildCard
                      name={`${child.firstName} ${child.middleName ? child.middleName + " " : ""
                        }${child.lastName}`}
                      age={child.age}
                      gender={child.gender}
                      attendance={status.attendance}
                      feeding={status.feeding}
                      lastUpdated={status.lastUpdated}
                      onPress={() => router.push(`/(teacher)/(child-details)/${child._id}`)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

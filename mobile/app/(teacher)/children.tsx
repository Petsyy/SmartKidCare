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
import { Search, X } from "lucide-react-native";

interface ChildStatus {
  attendance: string;
  feeding: string;
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
  }, [token]);

  // Get status for a specific child
  const getChildStatus = (childId: string): ChildStatus => {
    let attendance = "Not Recorded";
    let feeding = "Not Recorded";
    let lastUpdated = "No data";

    // Check attendance
    if (attendanceRecord?.records) {
      const attendanceEntry = attendanceRecord.records.find(
        (r: any) => (r.child._id || r.child) === childId
      );
      if (attendanceEntry) {
        attendance = attendanceEntry.status === "present" ? "Present" : "Absent";
        lastUpdated = new Date(attendanceRecord.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
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
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500">{error}</Text>
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

        {/* Search Bar */}
        <View className="mt-4 flex-row items-center bg-white rounded-lg px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Search by name or student ID..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <X size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>


      {/* LIST */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          {filteredChildren.length === 0 ? (
            <View className="items-center justify-center mt-10">
              <Text className="text-gray-500 text-center">
                {searchQuery
                  ? "No children found matching your search."
                  : "No children enrolled yet."}
              </Text>
              {searchQuery && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  className="mt-4 bg-teal-600 px-6 py-3 rounded-lg"
                >
                  <Text className="text-white font-semibold">Clear Search</Text>
                </Pressable>
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

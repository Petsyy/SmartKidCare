import { useMemo } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput,
  Pressable,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getChildren } from "@/src/api/teacher.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import { useAuth } from "@/src/hooks/use-auth";
import ChildCard from "@/src/components/child-card";
import { Search, Users, AlertCircle } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useTeacherUiStore } from "@/src/features/teacher/stores/teacher-ui.store";

interface ChildStatus {
  attendance: "Present" | "Absent" | "Not Recorded";
  feeding: "Finished" | "Missed" | "Not Recorded";
  lastUpdated: string;
}

export default function ChildScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { childrenSearchQuery: searchQuery, setChildrenSearchQuery: setSearchQuery } =
    useTeacherUiStore();
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: mobileQueryKeys.teacherChildrenOverview(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const [children, attendanceRecord, feedingRecord] = await Promise.all([
        getChildren(),
        getTodayAttendance().catch(() => null),
        getTodayFeeding().catch(() => null),
      ]);
      return { children, attendanceRecord, feedingRecord };
    },
  });

  const children = data?.children ?? [];
  const attendanceRecord = data?.attendanceRecord ?? null;
  const feedingRecord = data?.feedingRecord ?? null;

  // Get status for a specific child
  const getChildStatus = (childId: string): ChildStatus => {
    let attendance: "Present" | "Absent" | "Not Recorded" = "Not Recorded";
    let feeding: "Finished" | "Missed" | "Not Recorded" = "Not Recorded";
    let lastUpdated = "No data";

    // Check attendance
    if (attendanceRecord?.records) {
      const attendanceEntry = attendanceRecord.records.find(
        (r: any) => (r.child._id || r.child) === childId,
      );
      if (attendanceEntry) {
        attendance =
          attendanceEntry.status === "present" ? "Present" : "Absent";
        lastUpdated = new Date(attendanceRecord.createdAt).toLocaleTimeString(
          "en-PH",
          {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Manila",
          },
        );
      }
    }

    // Check feeding
    if (feedingRecord?.records) {
      const feedingEntry = feedingRecord.records.find(
        (r: any) => (r.child._id || r.child) === childId,
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
      const fullName =
        `${child.firstName} ${child.middleName || ""} ${child.lastName}`.toLowerCase();
      const studentId = child.studentId.toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
    });
  }, [children, searchQuery]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="mt-4 text-lg text-gray-600 font-medium">
            Loading children...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-6">
            <AlertCircle size={48} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
            Oops! Something Went Wrong
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-6">
            {error instanceof Error ? error.message : "Failed to load data."}
          </Text>
          <Pressable
            onPress={() => {
              void refetch();
            }}
            className="bg-teal-600 px-8 py-4 rounded-xl"
            style={{
              shadowColor: "#14B8A6",
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
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <View className="flex-row items-start">
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">
              Children List
            </Text>
            <Text className="text-lg text-teal-100 mt-1">
              {children.length} Enrolled Children
            </Text>
          </View>
        </View>
      </View>

      <View className="px-5 pt-4 pb-2 bg-gray-50">
        <View
          className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 border border-gray-200"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Search size={24} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-lg font-bold text-gray-800"
            placeholder="Search by name or student ID..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

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
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                    <Search size={40} color="#9CA3AF" />
                  </View>
                  <Text className="text-2xl font-black text-gray-800 mb-2 text-center">
                    No Children Found
                  </Text>
                  <Text className="text-lg font-bold text-gray-500 text-center leading-7">
                    No children match your search.{"\n"}
                    Try a different search term.
                  </Text>
                </>
              ) : (
                <>
                  <View className="h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 mb-4">
                    <Users size={56} color="#14B8A6" />
                  </View>
                  <Text className="text-2xl font-black text-gray-800 mb-2 text-center">
                    No Children Enrolled Yet
                  </Text>
                  <Text className="text-lg font-bold text-gray-500 text-center mb-6 leading-7">
                    Submit a child enrollment request and wait for admin
                    approval.
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View className="flex flex-col">
              {filteredChildren.map((child, index) => {
                const status = getChildStatus(child._id);
                return (
                  <View
                    key={child._id}
                    className={
                      index < filteredChildren.length - 1 ? "mb-3" : ""
                    }
                  >
                    <ChildCard
                      name={`${child.firstName} ${
                        child.middleName ? child.middleName + " " : ""
                      }${child.lastName}`}
                      age={child.age}
                      gender={child.gender}
                      attendance={status.attendance}
                      feeding={status.feeding}
                      lastUpdated={status.lastUpdated}
                      onPress={() =>
                        router.push(`/(teacher)/child-details/${child._id}`)
                      }
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

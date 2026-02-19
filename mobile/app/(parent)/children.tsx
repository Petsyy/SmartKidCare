import { useEffect, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getMyChildren, Child } from "@/src/api/parent.api";
import { getTodayAttendance, getTodayFeeding } from "@/src/api/records.api";
import ChildCard from "@/src/components/ChildCard";
import { useAuth } from "@/src/hooks/useAuth";

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
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [feedingRecord, setFeedingRecord] = useState<any>(null);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        if (!token) throw new Error("No authentication token");

        const [data, attendance, feeding] = await Promise.all([
          getMyChildren(token),
          getTodayAttendance(token).catch(() => null),
          getTodayFeeding(token).catch(() => null),
        ]);
        setChildren(data);
        setAttendanceRecord(attendance);
        setFeedingRecord(feeding);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, [token]);

  const getChildStatus = (childId: string): ChildStatus => {
    let attendance: "Present" | "Absent" | "Not Recorded" = "Not Recorded";
    let feeding: "Finished" | "Missed" | "Not Recorded" = "Not Recorded";
    let lastUpdated = "No data";

    if (attendanceRecord?.records) {
      const attendanceEntry = attendanceRecord.records.find((record: any) => {
        const recordChildId =
          typeof record?.child === "string"
            ? record.child
            : (record?.child?._id ?? "");
        return String(recordChildId) === String(childId);
      });

      if (attendanceEntry) {
        attendance = attendanceEntry.status === "present" ? "Present" : "Absent";
        const updatedAt =
          attendanceRecord.updatedAt ||
          attendanceRecord.createdAt ||
          attendanceRecord.date;
        if (updatedAt) {
          lastUpdated = new Date(updatedAt).toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Manila",
          });
        }
      }
    }

    if (feedingRecord?.records) {
      const feedingEntry = feedingRecord.records.find((record: any) => {
        const recordChildId =
          typeof record?.child === "string"
            ? record.child
            : (record?.child?._id ?? "");
        return String(recordChildId) === String(childId);
      });

      if (feedingEntry) {
        feeding = feedingEntry.status === "completed" ? "Finished" : "Missed";
      }
    }

    return { attendance, feeding, lastUpdated };
  };


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
          My Children
        </Text>
        <Text className="text-lg text-teal-100 mt-1">
          Children linked to your account
        </Text>
      </View>


      {/* LIST */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          {children.length === 0 ? (
            <Text className="text-center text-gray-500 mt-10">
              No children linked to your account.
            </Text>
          ) : (
            <View className="flex flex-col">
              {children.map((child, index) => {
                const status = getChildStatus(child._id);
                return (
                  <View
                    key={child._id}
                    className={index < children.length - 1 ? "mb-4" : ""}
                  >
                    <ChildCard
                      name={`${child.firstName} ${child.middleName ? child.middleName + " " : ""
                        }${child.lastName}`}
                      age={child.age}
                      gender={child.gender}
                      attendance={status.attendance}
                      feeding={status.feeding}
                      lastUpdated={status.lastUpdated}
                      onPress={() => {
                        router.push(`/(parent)/parent-child-details/${child._id}`);
                      }}
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

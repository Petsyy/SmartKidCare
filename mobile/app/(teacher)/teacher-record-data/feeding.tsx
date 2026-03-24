import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Check,
  X,
  ChevronDown,
  Search,
  CheckCircle,
} from "lucide-react-native";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { getChildren } from "@/src/api/teacher.api";
import {
  submitFeeding,
  getTodayFeeding,
  getTodayAttendance,
  type FeedingRecord,
} from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";
import {
  formatManilaDateLabel,
  getManilaDateKey,
  isValidManilaDateKey,
} from "@/src/utils/manila-date";

const foodMenuOptions = [
  "Sinigang, Adobo",
  "Rice with Chicken Adobo",
  "Spaghetti with Meatballs",
  "Fried Rice with Vegetables",
  "Chicken Tinola",
  "Pork Sinigang",
  "Beef Caldereta",
  "Fish Fillet with Rice",
  "Pancit Canton",
  "Lumpia with Rice",
  "Other",
];

export default function RecordFeeding() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedingStatus, setFeedingStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [foodServed, setFoodServed] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presentChildrenIds = useMemo(() => {
    try {
      return params.presentChildren
        ? (JSON.parse(params.presentChildren as string) as string[])
        : [];
    } catch {
      return [];
    }
  }, [params.presentChildren]);

  const attendanceDateKey = useMemo(() => {
    const rawDateKey = String(params.attendanceDateKey || "").trim();
    return isValidManilaDateKey(rawDateKey)
      ? rawDateKey
      : getManilaDateKey();
  }, [params.attendanceDateKey]);

  const attendanceDateLabel = useMemo(() => {
    const explicitLabel = String(params.attendanceDateLabel || "").trim();
    if (explicitLabel) return explicitLabel;

    const legacyDateLabel = String(params.attendanceDate || "").trim();
    if (legacyDateLabel) {
      const parsedLegacy = new Date(legacyDateLabel);
      if (!Number.isNaN(parsedLegacy.getTime())) {
        return formatManilaDateLabel(parsedLegacy);
      }
    }

    return formatManilaDateLabel(attendanceDateKey);
  }, [attendanceDateKey, params.attendanceDate, params.attendanceDateLabel]);

  const interactionDisabled = isReadOnly || isSubmitting;


  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [childrenData, todayRecord] = await Promise.all([
          getChildren(token),
          getTodayFeeding(token),
        ]);

        let childrenToShow: Child[] = [];

        if (todayRecord) {
          const recordedChildIds = new Set(
            todayRecord.records.map((r: any) => String(r.child._id || r.child)),
          );
          childrenToShow = childrenData.filter((child) =>
            recordedChildIds.has(child._id),
          );

          setIsReadOnly(true);
          setFoodServed(todayRecord.foodServed);

          const existingStatus: Record<string, boolean> = {};
          todayRecord.records.forEach((record: any) => {
            existingStatus[String(record.child._id || record.child)] =
              record.status !== "completed";
          });
          setFeedingStatus(existingStatus);
        } else {
          if (presentChildrenIds.length > 0) {
            const presentIds = new Set(presentChildrenIds.map(String));
            childrenToShow = childrenData.filter((child) =>
              presentIds.has(child._id),
            );
          } else {
            const todayAttendance = await getTodayAttendance(token);
            if (todayAttendance?.records) {
              const presentIds = new Set(
                todayAttendance.records
                  .filter((r: any) => r.status === "present")
                  .map((r: any) => String(r.child._id || r.child)),
              );
              childrenToShow = childrenData.filter((child) =>
                presentIds.has(child._id),
              );
            }
          }

          const initialStatus: Record<string, boolean> = {};
          childrenToShow.forEach((child) => {
            initialStatus[child._id] = true;
          });
          setFeedingStatus(initialStatus);
        }

        setChildren(childrenToShow);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, presentChildrenIds]);

  const filteredChildren = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return children;

    return children.filter((child) => {
      const fullName =
        `${child.lastName}, ${child.firstName} ${child.middleName || ""}`.toLowerCase();
      const studentId = String(child.studentId || "").toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
    });
  }, [children, searchQuery]);

  const stats = useMemo(() => {
    const missed = Object.values(feedingStatus).filter(Boolean).length;
    const fed = children.length - missed;
    return { fed, missed, total: children.length };
  }, [feedingStatus, children.length]);

  const toggleChildFeeding = useCallback((childId: string) => {
    setFeedingStatus((prev) => ({
      ...prev,
      [childId]: !prev[childId],
    }));
  }, []);

  const markAllAsCompleted = useCallback(() => {
    const allFed: Record<string, boolean> = {};
    children.forEach((child) => {
      allFed[child._id] = false;
    });
    setFeedingStatus(allFed);
  }, [children]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (isReadOnly) {
      router.push("/(teacher)");
      return;
    }

    if (!token) {
      Alert.alert(
        "Authentication Error",
        "You must be logged in to submit feeding records.",
      );
      return;
    }

    if (!foodServed) {
      Alert.alert("Validation Error", "Please select food served");
      return;
    }

    setIsSubmitting(true);
    try {
      const records: FeedingRecord[] = Object.entries(feedingStatus).map(
        ([childId, isMissed]) => ({
          child: childId,
          status: !isMissed ? ("completed" as const) : ("missed" as const),
        }),
      );

      await submitFeeding(token, {
        date: attendanceDateKey,
        foodServed,
        records,
      });

      Alert.alert(
        "Success",
        "Records saved successfully!",
        [{ text: "OK", onPress: () => router.push("/(teacher)") }],
      );
    } catch (error) {
      Alert.alert(
        "Submission Error",
        "Failed to submit feeding records. Please try again.",
      );
      console.error("Feeding submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChildCard = useCallback(
    ({ item: child }: { item: Child }) => (
      <Pressable
        onPress={() => !interactionDisabled && toggleChildFeeding(child._id)}
        disabled={interactionDisabled}
        className={`mx-6 mb-3 overflow-hidden rounded-2xl border ${
          !feedingStatus[child._id]
            ? "border-teal-200 bg-teal-50"
            : "border-gray-200 bg-white"
        } ${interactionDisabled ? "opacity-90" : ""}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center p-4">
          <View
            className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
              !feedingStatus[child._id] ? "bg-teal-600" : "bg-gray-400"
            }`}
          >
            <Text className="text-xl font-bold text-white">
              {child.firstName.charAt(0)}
              {child.lastName.charAt(0)}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">
              {child.lastName}, {child.firstName}
              {child.middleName ? ` ${child.middleName}` : ""}
            </Text>
            <Text className="mt-0.5 text-base text-gray-600">
              {child.studentId || `${child.age} years old - ${child.gender}`}
            </Text>
            <View
              className={`mt-2 self-start rounded-full px-2.5 py-1 ${
                !feedingStatus[child._id] ? "bg-teal-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  !feedingStatus[child._id] ? "text-teal-700" : "text-gray-600"
                }`}
              >
                {!feedingStatus[child._id] ? "Completed" : "Missed"}
              </Text>
            </View>
          </View>

          <View className="items-center">
            {!feedingStatus[child._id] ? (
              <CheckCircle size={30} color="#0F766E" />
            ) : (
              <X size={30} color="#9CA3AF" />
            )}
          </View>
        </View>
      </Pressable>
    ),
    [feedingStatus, interactionDisabled, toggleChildFeeding],
  );

  const headerSection = (
    <>
      {isReadOnly && (
        <View className="px-6 pt-4 pb-5">
          <View className="rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                <CheckCircle size={22} color="#0F766E" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-teal-900">
                  Successfully Submitted
                </Text>
                <Text className="mt-1 text-base text-teal-800">
                  Feeding for today were successfully submitted.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}


      <View className="px-6 pb-5 py-4">
        <View className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <View className="flex-row items-start mb-2">
            <Check size={16} color="#10B981" className="mt-0.5" />
            <Text className="ml-2 text-base text-gray-800 flex-1">
              <Text className="font-semibold">Completed</Text> - child consumed
              the lunch meal as observed by the teacher
            </Text>
          </View>
          <View className="flex-row items-start">
            <X size={16} color="#EF4444" className="mt-0.5" />
            <Text className="ml-2 text-base text-gray-800 flex-1">
              <Text className="font-semibold">Missed</Text> - child did not eat,
              refused food, or was not present during lunch
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 pb-5">
        <Text className="text-lg font-medium text-gray-700 mb-2">
          Food Served (Menu) <Text className="text-red-500">*</Text>
        </Text>
        <Pressable
          onPress={() => !interactionDisabled && setShowMenuModal(true)}
          disabled={interactionDisabled}
          className={`flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 ${
            interactionDisabled ? "opacity-75" : ""
          }`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Text
            className={`text-lg font-medium ${foodServed ? "text-gray-800" : "text-gray-400"}`}
          >
            {foodServed || "Select food menu"}
          </Text>
          {!interactionDisabled && <ChevronDown size={20} color="#9CA3AF" />}
        </Pressable>
      </View>

      <View className="px-6 pb-5">
        <View className="flex-row gap-2">
          <View
            className="flex-1 rounded-2xl border border-gray-200 bg-white p-3"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                <Check size={16} color="#4B5563" />
              </View>
              <Text className="ml-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
                Total
              </Text>
            </View>
            <Text className="mt-2 text-3xl font-black text-gray-800">
              {stats.total}
            </Text>
          </View>

          <View
            className="flex-1 rounded-2xl border border-teal-200 bg-teal-50 p-3"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                <CheckCircle size={16} color="#0F766E" />
              </View>
              <Text className="ml-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
                Completed
              </Text>
            </View>
            <Text className="mt-2 text-3xl font-black text-teal-700">
              {stats.fed}
            </Text>
          </View>

          <View
            className="flex-1 rounded-2xl border border-red-200 bg-red-50 p-3"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <X size={16} color="#B91C1C" />
              </View>
              <Text className="ml-2 text-sm font-semibold uppercase tracking-wide text-red-700">
                Missed
              </Text>
            </View>
            <Text className="mt-2 text-3xl font-black text-red-700">
              {stats.missed}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 pb-5">
        <View
          className="flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3.5"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Search size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-lg text-gray-800"
            placeholder="Search by child name or student ID"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {!isReadOnly && (
        <View className="px-6 pb-5">
          <Pressable
            onPress={markAllAsCompleted}
            disabled={isSubmitting}
            className={`flex-row items-center justify-center rounded-xl border px-4 py-3 ${
              isSubmitting
                ? "border-emerald-300 bg-emerald-300"
                : "border-emerald-600 bg-emerald-600 active:opacity-85"
            }`}
            style={{
              shadowColor: "#059669",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <CheckCircle size={16} color="white" />
            <Text className="ml-2 text-base font-semibold text-white">
              Mark All as Completed
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50 justify-center items-center">
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
          <Text className="text-2xl font-bold text-gray-800 mt-4">
            No Present Children
          </Text>
          <Text className="text-center text-gray-600 mt-2">
            Please mark attendance first to record feeding.
          </Text>
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View className="bg-teal-600 px-6 pt-12 pb-6">
        <View className="flex-row mb-2">
          <Pressable
            onPress={() => router.push("/(teacher)")}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3 mt-4"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">
              Record Feeding
            </Text>
            <Text className="text-base text-teal-100 mt-1">
              {attendanceDateLabel}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredChildren}
        keyExtractor={(item) => item._id}
        renderItem={renderChildCard}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={headerSection}
        ListEmptyComponent={
          searchQuery ? (
            <View className="mx-6 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-10">
              <Search size={48} color="#D1D5DB" />
              <Text className="mt-4 text-xl font-semibold text-gray-700">
                No child found
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Try searching with a different name
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View className="px-6 pb-4">
            <View className="mt-2 flex-row items-start rounded-2xl border border-teal-200 bg-teal-50 p-3.5">
              <CheckCircle size={16} color="#14B8A6" className="mt-0.5" />
              <Text className="ml-2 text-base text-gray-700 flex-1">
                Feeding records are teacher-observed, teacher-confirmed, and
                securely stored
              </Text>
            </View>
          </View>
        }
      />

      <Modal
        visible={showMenuModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-3xl bg-white">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-800">
                  Select Food Menu
                </Text>
                <Pressable onPress={() => setShowMenuModal(false)}>
                  <Text className="text-lg font-semibold text-teal-600">
                    Close
                  </Text>
                </Pressable>
              </View>
            </View>
            <View className="max-h-96">
              <FlatList
                data={foodMenuOptions}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item: food }) => (
                  <Pressable
                    onPress={() => {
                      setFoodServed(food);
                      setShowMenuModal(false);
                    }}
                    className={`border-b px-6 py-4 active:bg-gray-50 ${
                      foodServed === food ? "border-teal-100 bg-teal-50" : "border-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-lg ${
                        foodServed === food ? "font-semibold text-teal-700" : "text-gray-800"
                      }`}
                    >
                      {food}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 px-6 py-4">
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          android_ripple={{ color: "transparent" }}
          className={`items-center justify-center rounded-2xl py-4 ${
            isSubmitting ? "bg-emerald-400" : "bg-emerald-600 active:opacity-90"
          }`}
          style={{
            shadowColor: "#059669",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.28,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center">
            {isSubmitting && <ActivityIndicator color="#FFFFFF" size="small" />}
            <Text className={`text-white text-xl font-bold ${isSubmitting ? "ml-2" : ""}`}>
              {isReadOnly
                ? "Back to Dashboard"
                : isSubmitting
                  ? "Saving..."
                  : "Save Feeding"}
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

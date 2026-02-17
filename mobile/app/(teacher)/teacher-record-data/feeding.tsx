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
  Lock,
} from "lucide-react-native";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { getChildren } from "@/src/api/teacher.api";
import {
  submitFeeding,
  getTodayFeeding,
  getTodayAttendance,
  type FeedingRecord,
  type OnChainData,
} from "@/src/api/records.api";
import type { Child } from "@/src/api/parent.api";

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
  const [blockchainData, setBlockchainData] = useState<OnChainData | null>(
    null,
  );
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

  const attendanceDate =
    (params.attendanceDate as string) ||
    new Date().toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    });

  const interactionDisabled = isReadOnly || isSubmitting;

  useEffect(() => {
    if (!params.blockchainData) return;
    try {
      const data = JSON.parse(params.blockchainData as string) as OnChainData;
      setBlockchainData(data);
    } catch (err) {
      console.error("Failed to parse blockchain data:", err);
    }
  }, [params.blockchainData]);

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

      const response = await submitFeeding(token, {
        date: attendanceDate,
        foodServed,
        records,
      });

      if (response.onChain) {
        setBlockchainData(response.onChain);
      }

      Alert.alert(
        "Success",
        "Records saved successfully!\n\nBlockchain verification is processing in the background.",
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
        className={`mx-6 mb-3 rounded-xl overflow-hidden border-2 ${
          !feedingStatus[child._id]
            ? "bg-teal-50 border-teal-400"
            : "bg-white border-gray-200"
        } ${interactionDisabled ? "opacity-90" : ""}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center p-4">
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
              !feedingStatus[child._id] ? "bg-teal-500" : "bg-gray-300"
            }`}
          >
            <Text className="text-white font-bold text-lg">
              {child.firstName.charAt(0)}
              {child.lastName.charAt(0)}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-lg font-bold text-gray-800">
                {child.lastName}, {child.firstName}
                {child.middleName ? ` ${child.middleName}` : ""}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mt-0.5">
              {child.studentId || `${child.age} years old • ${child.gender}`}
            </Text>
          </View>

          <View>
            {!feedingStatus[child._id] ? (
              <View className="items-center">
                <CheckCircle size={32} color="#14B8A6" />
                <Text className="text-teal-600 font-bold text-sm mt-1">
                  Completed
                </Text>
              </View>
            ) : (
              <View className="items-center">
                <X size={32} color="#9CA3AF" />
                <Text className="text-gray-500 font-medium text-sm mt-1">
                  Missed
                </Text>
              </View>
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
          <View className="bg-teal-50 border-2 border-teal-300 rounded-lg p-4 flex-row items-center">
            <CheckCircle size={24} color="#14B8A6" />
            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-teal-800">
                Successfully Submitted
              </Text>
              <Text className="text-sm text-teal-700 mt-1">
                Feeding for today were successfully submitted.
              </Text>
            </View>
          </View>
        </View>
      )}

      {blockchainData && blockchainData.successes.length > 0 && (
        <View className="px-6 pb-5">
          <View className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <View className="flex-row items-center mb-2">
              <Lock size={20} color="#3B82F6" />
              <Text className="text-base font-bold text-blue-800 ml-2">
                Saved on Blockchain
              </Text>
            </View>
            <Text className="text-sm text-blue-700 mb-2">
              Records secured with blockchain verification
            </Text>
            <View className="bg-blue-100 p-3 rounded-lg">
              <Text className="text-xs font-semibold text-blue-900 mb-1">
                Transaction Hash:
              </Text>
              <Text
                className="text-xs text-blue-800 font-mono"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {blockchainData.successes[0].result.txHash}
              </Text>
              <Text className="text-xs text-blue-600 mt-2">
                {blockchainData.successes.length} record
                {blockchainData.successes.length > 1 ? "s" : ""} verified on
                blockchain
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className="px-6 pb-5 py-4">
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <View className="flex-row items-start mb-2">
            <Check size={16} color="#10B981" className="mt-0.5" />
            <Text className="ml-2 text-sm text-gray-800 flex-1">
              <Text className="font-semibold">Completed</Text> - child consumed
              the lunch meal as observed by the teacher
            </Text>
          </View>
          <View className="flex-row items-start">
            <X size={16} color="#EF4444" className="mt-0.5" />
            <Text className="ml-2 text-sm text-gray-800 flex-1">
              <Text className="font-semibold">Missed</Text> - child did not eat,
              refused food, or was not present during lunch
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 pb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">
          Food Served (Menu) <Text className="text-red-500">*</Text>
        </Text>
        <Pressable
          onPress={() => !interactionDisabled && setShowMenuModal(true)}
          disabled={interactionDisabled}
          className={`flex-row items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 ${
            interactionDisabled ? "opacity-75" : ""
          }`}
        >
          <Text
            className={`text-base ${foodServed ? "text-gray-800" : "text-gray-400"}`}
          >
            {foodServed || "Select food menu"}
          </Text>
          {!interactionDisabled && <ChevronDown size={20} color="#9CA3AF" />}
        </Pressable>
      </View>

      <View className="px-6 pb-5">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-teal-50 p-3 rounded-xl shadow-sm border border-teal-100">
            <View className="flex-row items-center">
              <CheckCircle size={18} color="#14B8A6" />
              <Text className="ml-2 text-xs text-teal-700">Completed</Text>
            </View>
            <Text className="text-xl font-bold text-teal-700 mt-1">
              {stats.fed}
            </Text>
          </View>

          <View className="flex-1 bg-red-50 p-3 rounded-xl shadow-sm border border-red-100">
            <View className="flex-row items-center">
              <X size={18} color="#EF4444" />
              <Text className="ml-2 text-xs text-red-700">Missed</Text>
            </View>
            <Text className="text-xl font-bold text-red-700 mt-1">
              {stats.missed}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 pb-5">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Search child name"
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
            className={`flex-row items-center justify-center px-4 py-2.5 rounded-lg ${
              isSubmitting ? "bg-teal-300" : "bg-teal-500"
            }`}
          >
            <CheckCircle size={16} color="white" />
            <Text className="ml-2 text-white text-sm font-semibold">
              Mark All as Completed
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );

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
          <Text className="text-xl font-bold text-gray-800 mt-4">
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
          <Pressable onPress={() => router.push("/(teacher)")} className="mr-3 mt-4">
            <ChevronLeft size={30} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">
              Record Feeding
            </Text>
            <Text className="text-base text-teal-100 mt-1">{attendanceDate}</Text>
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
            <View className="items-center justify-center py-8">
              <Search size={48} color="#D1D5DB" />
              <Text className="text-gray-700 font-semibold text-lg mt-4">
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
            <View className="flex-row items-start bg-teal-50 border border-teal-200 rounded-lg p-3 mt-2">
              <CheckCircle size={16} color="#14B8A6" className="mt-0.5" />
              <Text className="ml-2 text-sm text-gray-700 flex-1">
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
          <View className="bg-white rounded-t-3xl">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-800">
                  Select Food Menu
                </Text>
                <Pressable onPress={() => setShowMenuModal(false)}>
                  <Text className="text-teal-600 font-semibold text-base">
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

      <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200">
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          android_ripple={{ color: "transparent" }}
          className={`py-4 rounded-xl items-center justify-center ${
            isSubmitting ? "bg-teal-400" : "bg-teal-600"
          }`}
          style={{
            shadowColor: "#14B8A6",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center">
            {isSubmitting && <ActivityIndicator color="#FFFFFF" size="small" />}
            <Text className={`text-white text-lg font-bold ${isSubmitting ? "ml-2" : ""}`}>
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

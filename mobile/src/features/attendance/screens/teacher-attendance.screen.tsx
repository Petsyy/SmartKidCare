import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react-native";
import { useTeacherAttendance } from "@/src/features/attendance/hooks";

export default function RecordAttendance() {
  const {
    router,
    children,
    loading,
    attendance,
    searchQuery,
    setSearchQuery,
    selectedDateLabel,
    isReadOnly,
    filteredChildren,
    stats,
    toggleAttendance,
    markAllPresent,
    markAllAbsent,
    handleSubmit,
  } = useTeacherAttendance();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text className="mt-4 text-gray-600">Loading children...</Text>
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

      {/* HEADER */}
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
              Record Attendance
            </Text>
            <Text className="text-base text-teal-100 mt-1">
              {selectedDateLabel}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" keyboardDismissMode="on-drag">
        {/* Read-Only Banner */}
        {isReadOnly && (
          <View className="px-6 pt-4 pb-5">
            <View className="rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                  <CheckCircle2 size={22} color="#0F766E" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-teal-900">
                    Successfully Submitted
                  </Text>
                  <Text className="mt-1 text-base text-teal-800">
                    Attendance for today were successfully submitted.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <View className="px-6 pb-5 pt-4">
          <View className="flex-row justify-between gap-3">
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
                  <Users size={16} color="#4B5563" />
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
                  <CheckCircle2 size={16} color="#0F766E" />
                </View>
                <Text className="ml-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Present
                </Text>
              </View>
              <Text className="mt-2 text-3xl font-black text-teal-700">
                {stats.present}
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
                  <XCircle size={16} color="#B91C1C" />
                </View>
                <Text className="ml-2 text-sm font-semibold uppercase tracking-wide text-red-700">
                  Absent
                </Text>
              </View>
              <Text className="mt-2 text-3xl font-black text-red-700">
                {stats.absent}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {!isReadOnly && (
          <View className="px-6 pb-5">
            <View className="flex-row gap-2">
              <Pressable
                onPress={markAllPresent}
                className="flex-1 flex-row items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 py-3 active:opacity-85"
                style={{
                  shadowColor: "#059669",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <CheckCircle2 size={16} color="white" />
                <Text className="ml-1.5 text-base font-semibold text-white">
                  Mark All Present
                </Text>
              </Pressable>

              <Pressable
                onPress={markAllAbsent}
                className="flex-1 flex-row items-center justify-center rounded-xl border border-slate-600 bg-slate-600 py-3 active:opacity-85"
                style={{
                  shadowColor: "#334155",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <XCircle size={16} color="white" />
                <Text className="ml-1.5 text-base font-semibold text-white">
                  Mark All Absent
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Search Bar */}
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

        {/* Children List */}
        <View className="px-6">
          {filteredChildren.length === 0 ? (
            <View className="items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-12 px-6">
              <Users size={48} color="#D1D5DB" />
              {searchQuery ? (
                <>
                  <Text className="mt-4 text-center text-base font-semibold text-gray-500">
                    No children found
                  </Text>
                  <Text className="mt-1 text-center text-sm text-gray-400">
                    Try a different name or student ID
                  </Text>
                </>
              ) : (
                <>
                  <Text className="mt-4 text-center text-base font-semibold text-gray-500">
                    No children assigned yet
                  </Text>
                  <Text className="mt-1 text-center text-sm text-gray-400">
                    Contact your administrator to assign children to your class
                  </Text>
                </>
              )}
            </View>
          ) : (
            filteredChildren.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => !isReadOnly && toggleAttendance(item._id)}
                disabled={isReadOnly}
                className={`mb-3 overflow-hidden rounded-2xl border ${
                  attendance[item._id]
                    ? "border-teal-200 bg-teal-50"
                    : "border-gray-200 bg-white"
                } ${isReadOnly ? "opacity-90" : ""}`}
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
                    className={`h-12 w-12 items-center justify-center rounded-full ${
                      attendance[item._id] ? "bg-teal-600" : "bg-gray-400"
                    }`}
                  >
                    <Text className="text-xl font-bold text-white">
                      {item.firstName.charAt(0)}
                      {item.lastName.charAt(0)}
                    </Text>
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {item.lastName}, {item.firstName}
                      {item.middleName ? ` ${item.middleName}` : ""}
                    </Text>
                    <Text className="mt-0.5 text-base text-gray-600">
                      {item.studentId}
                    </Text>
                    <View
                      className={`mt-2 self-start rounded-full px-2.5 py-1 ${
                        attendance[item._id] ? "bg-teal-100" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          attendance[item._id]
                            ? "text-teal-700"
                            : "text-gray-600"
                        }`}
                      >
                        {attendance[item._id] ? "Present" : "Absent"}
                      </Text>
                    </View>
                  </View>

                  <View className="items-center">
                    {attendance[item._id] ? (
                      <CheckCircle2 size={30} color="#0F766E" />
                    ) : (
                      <XCircle size={30} color="#9CA3AF" />
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Bottom spacing for keyboard */}
        <View className="h-32" />
      </ScrollView>

      {/* Submit Button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 px-6 py-4">
        {children.length === 0 ? (
          <View className="items-center justify-center rounded-2xl bg-gray-100 py-4">
            <Text className="text-base font-semibold text-gray-400">
              No children assigned to submit
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleSubmit}
            android_ripple={{ color: "transparent" }}
            className="items-center justify-center rounded-2xl bg-emerald-600 py-4 active:opacity-90"
            style={({ pressed }) => [
              {
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 8,
                elevation: 5,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text className="text-xl font-bold text-white">
              {isReadOnly ? "View Feeding Record" : "Submit Attendance"}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

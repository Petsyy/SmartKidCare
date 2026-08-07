import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import {
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react-native";
import { useTeacherAttendance } from "@/src/features/attendance/hooks";
import { ScreenShell, ScreenHeader, SearchBar, MiniStatCard } from "@/src/components/ui";

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
      <ScreenShell className="flex-1 bg-gray-50 justify-center items-center" withKeyboardAvoiding={false}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text className="mt-4 text-gray-600">Loading children...</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        title="Record Attendance"
        subtitle={selectedDateLabel}
        onBack={() => router.push("/(teacher)")}
      />

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
            <MiniStatCard
              label="Total"
              value={stats.total}
              icon={Users}
              variant="default"
            />
            <MiniStatCard
              label="Present"
              value={stats.present}
              icon={CheckCircle2}
              variant="teal"
            />
            <MiniStatCard
              label="Absent"
              value={stats.absent}
              icon={XCircle}
              variant="red"
            />
          </View>
        </View>

        {/* Quick Actions */}
        {!isReadOnly && (
          <View className="px-6 pb-5">
            <View className="flex-row gap-2">
              <Pressable
                onPress={markAllPresent}
                className="flex-1 flex-row items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 py-3 active:opacity-85 shadow-sm"
              >
                <CheckCircle2 size={16} color="white" />
                <Text className="ml-1.5 text-base font-semibold text-white">
                  Mark All Present
                </Text>
              </Pressable>

              <Pressable
                onPress={markAllAbsent}
                className="flex-1 flex-row items-center justify-center rounded-xl border border-slate-600 bg-slate-600 py-3 active:opacity-85 shadow-sm"
              >
                <XCircle size={16} color="white" />
                <Text className="ml-1.5 text-base font-semibold text-white">
                  Mark All Absent
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by child name or student ID"
        />

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
                className={`mb-3 overflow-hidden rounded-2xl border shadow-sm ${
                  attendance[item._id]
                    ? "border-teal-200 bg-teal-50"
                    : "border-gray-200 bg-white"
                } ${isReadOnly ? "opacity-90" : ""}`}
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
            className="items-center justify-center rounded-2xl bg-emerald-600 py-4 active:opacity-90 shadow-md"
          >
            <Text className="text-xl font-bold text-white">
              {isReadOnly ? "View Feeding Record" : "Submit Attendance"}
            </Text>
          </Pressable>
        )}
      </View>
    </ScreenShell>
  );
}

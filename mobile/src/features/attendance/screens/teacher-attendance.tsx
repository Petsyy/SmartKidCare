import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { CheckCircle2, XCircle, Users } from "lucide-react-native";
import { useTeacherAttendance } from "@/src/features/attendance/hooks";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  SearchBar,
} from "@/src/components/ui";

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
    isSubmitting,
    showSuccessFeedback,
    dismissSuccessFeedback,
  } = useTeacherAttendance();
  const presentPercentage =
    stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  if (loading) {
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Record Attendance"
          onBack={() => router.back()}
        />
        <ScreenLoadingState
          title="Loading attendance"
          message="Getting your class attendance list ready."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Record Attendance"
        subtitle={selectedDateLabel}
        onBack={() => router.push("/(teacher)")}
      />

      <ScrollView className="flex-1" keyboardDismissMode="on-drag">
        {/* Attendance Overview */}
        <View className="px-6 pb-5 pt-4">
          <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text
                  className="text-xl font-extrabold text-gray-900"
                  accessibilityRole="header"
                >
                  Attendance overview
                </Text>
                <Text className="mt-1 text-base text-gray-600">
                  {presentPercentage}% of the class marked present
                </Text>
              </View>
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Text className="text-2xl font-extrabold text-slate-800">
                  {stats.total}
                </Text>
                <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </Text>
              </View>
            </View>

            <View className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
              <View
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${presentPercentage}%` as `${number}%`,
                }}
              />
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 flex-row items-center rounded-2xl bg-emerald-50 p-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 size={22} color="#047857" />
                </View>
                <View className="ml-3">
                  <Text className="text-2xl font-extrabold text-emerald-800">
                    {stats.present}
                  </Text>
                  <Text className="text-sm font-semibold text-emerald-700">
                    Present
                  </Text>
                </View>
              </View>

              <View className="flex-1 flex-row items-center rounded-2xl bg-red-50 p-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <XCircle size={22} color="#B91C1C" />
                </View>
                <View className="ml-3">
                  <Text className="text-2xl font-extrabold text-red-800">
                    {stats.absent}
                  </Text>
                  <Text className="text-sm font-semibold text-red-700">
                    Absent
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {!isReadOnly && (
          <View className="px-6 pb-5">
            <View className="flex-row gap-2">
              <Pressable
                onPress={markAllPresent}
                accessibilityRole="button"
                accessibilityLabel="Mark all children present"
                accessibilityHint="Changes every child in the class list to Present"
                className="flex-1 flex-row items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 py-3 active:opacity-85 shadow-sm"
              >
                <CheckCircle2 size={16} color="white" />
                <Text className="ml-1.5 text-base font-semibold text-white">
                  Mark All Present
                </Text>
              </Pressable>

              <Pressable
                onPress={markAllAbsent}
                accessibilityRole="button"
                accessibilityLabel="Mark all children absent"
                accessibilityHint="Changes every child in the class list to Absent"
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

        <View className="px-6 pb-3">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-xl font-extrabold text-gray-900"
              accessibilityRole="header"
            >
              Class list
            </Text>
            <View className="rounded-full bg-gray-200 px-3 py-1">
              <Text className="text-sm font-semibold text-gray-700">
                {children.length} {children.length === 1 ? "child" : "children"}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-base leading-6 text-gray-600">
            {isReadOnly
              ? "Submitted attendance is read-only."
              : "Tap a child to mark Present or Absent."}
          </Text>
        </View>

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
                accessibilityRole="button"
                accessibilityLabel={`${item.lastName}, ${item.firstName}${
                  item.middleName ? ` ${item.middleName}` : ""
                }, student ID ${item.studentId}, ${
                  attendance[item._id] ? "Present" : "Absent"
                }`}
                accessibilityHint={
                  isReadOnly
                    ? "Submitted attendance cannot be changed"
                    : `Double tap to mark ${
                        attendance[item._id] ? "Absent" : "Present"
                      }`
                }
                accessibilityState={{
                  disabled: isReadOnly,
                  selected: attendance[item._id],
                }}
                className={`mb-3 overflow-hidden rounded-2xl border shadow-sm ${
                  attendance[item._id]
                    ? "border-teal-200 bg-teal-50"
                    : "border-red-200 bg-red-50"
                } ${isReadOnly ? "opacity-90" : ""}`}
              >
                <View className="flex-row items-center p-4">
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-full ${
                      attendance[item._id] ? "bg-teal-600" : "bg-red-500"
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
                        attendance[item._id] ? "bg-teal-100" : "bg-red-100"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          attendance[item._id]
                            ? "text-teal-700"
                            : "text-red-700"
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
                      <XCircle size={30} color="#B91C1C" />
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

      <Modal
        visible={showSuccessFeedback}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={dismissSuccessFeedback}
      >
        <View
          className="flex-1 bg-emerald-50 px-6"
          accessibilityViewIsModal
          accessibilityLabel="Attendance submission confirmation"
        >
          <View className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100" />
          <View className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-100" />

          <View className="flex-1 items-center justify-center">
            <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-200 bg-white shadow-lg shadow-emerald-200">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-600">
                <CheckCircle2 size={48} color="#FFFFFF" />
              </View>
            </View>

            <Text
              className="mt-8 text-center text-3xl font-extrabold text-emerald-950"
              accessibilityRole="header"
            >
              Attendance Submitted
            </Text>
            <Text
              className="mt-3 max-w-sm text-center text-lg leading-7 text-emerald-900"
              accessibilityLiveRegion="polite"
            >
              Attendance has been submitted successfully.
            </Text>
          </View>

          <Pressable
            onPress={dismissSuccessFeedback}
            accessibilityRole="button"
            accessibilityLabel="Done"
            accessibilityHint="Returns to the submitted attendance list"
            className="mb-8 min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 shadow-md active:opacity-90"
          >
            <Text className="text-xl font-bold text-white">Done</Text>
          </Pressable>
        </View>
      </Modal>

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
            disabled={isSubmitting || isReadOnly}
            accessibilityRole="button"
            accessibilityLabel={
              isReadOnly
                ? "Attendance submitted"
                : isSubmitting
                  ? "Submitting attendance"
                  : "Submit attendance"
            }
            accessibilityHint={
              isReadOnly
                ? "Attendance has already been submitted"
                : "Submits today's attendance record"
            }
            accessibilityState={{
              disabled: isSubmitting || isReadOnly,
              busy: isSubmitting,
            }}
            android_ripple={{ color: "transparent" }}
            className={`min-h-14 flex-row items-center justify-center rounded-2xl py-4 shadow-md ${
              isSubmitting || isReadOnly
                ? "bg-emerald-400"
                : "bg-emerald-600 active:opacity-90"
            }`}
          >
            {isSubmitting ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-xl font-bold text-white">
                  Submitting...
                </Text>
              </View>
            ) : (
              <Text className="text-xl font-bold text-white">
                {isReadOnly ? "Attendance Submitted" : "Submit Attendance"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </ScreenShell>
  );
}

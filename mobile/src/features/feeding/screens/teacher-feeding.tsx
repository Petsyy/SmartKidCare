import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import {
  Check,
  X,
  ChevronDown,
  Search,
  CheckCircle,
} from "lucide-react-native";
import { useCallback } from "react";
import { useTeacherFeeding } from "@/src/features/feeding/hooks";
import type { Child } from "@/src/api/parent.api";
import { useUnsavedChangesGuard } from "@/src/hooks/use-unsaved-changes-guard";
import {
  ScreenShell,
  ScreenHeader,
  SearchBar,
  MiniStatCard,
} from "@/src/components/ui";

export default function RecordFeeding() {
  const {
    router,
    children,
    loading,
    feedingStatus,
    feedingNotes,
    foodServed,
    setFoodServed,
    searchQuery,
    setSearchQuery,
    showMenuModal,
    setShowMenuModal,
    isReadOnly,
    isSubmitting,
    attendanceDateLabel,
    interactionDisabled,
    filteredChildren,
    stats,
    hasUnsavedChanges,
    toggleChildFeeding,
    setChildNote,
    markAllAsCompleted,
    handleSubmit,
    submitBeforeLeaving,
    foodMenuOptions,
  } = useTeacherFeeding();

  useUnsavedChangesGuard({
    hasUnsavedChanges,
    isSaving: isSubmitting,
    onSave: submitBeforeLeaving,
    saveLabel: "Submit Record",
    message:
      "You have unsaved feeding progress. Submit it to the focal person before leaving?",
  });

  const renderChildCard = useCallback(
    ({ item: child }: { item: Child }) => (
      <View
        className={`mx-6 mb-3 overflow-hidden rounded-2xl border shadow-sm ${
          !feedingStatus[child._id]
            ? "border-teal-200 bg-teal-50"
            : "border-gray-200 bg-white"
        } ${interactionDisabled ? "opacity-90" : ""}`}
      >
        <Pressable
          onPress={() => !interactionDisabled && toggleChildFeeding(child._id)}
          disabled={interactionDisabled}
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
                    !feedingStatus[child._id]
                      ? "text-teal-700"
                      : "text-gray-600"
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

        <View className="border-t border-gray-100 px-4 pb-4 pt-3">
          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Notes for focal person (optional)
          </Text>
          <TextInput
            value={feedingNotes[child._id] || ""}
            onChangeText={(value) => setChildNote(child._id, value)}
            editable={!interactionDisabled}
            multiline
            maxLength={500}
            placeholder="Add observations like refused vegetables, asked for extra rice, or partial intake details"
            textAlignVertical="top"
            className="min-h-[92px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800"
          />
          <Text className="mt-2 text-right text-xs text-gray-400">
            {(feedingNotes[child._id] || "").length}/500
          </Text>
        </View>
      </View>
    ),
    [
      feedingNotes,
      feedingStatus,
      interactionDisabled,
      setChildNote,
      toggleChildFeeding,
    ],
  );

  const headerSection = (
    <>
      {isReadOnly && (
        <View className="px-6 pb-5 pt-4">
          <View className="rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                <CheckCircle size={22} color="#0F766E" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-teal-900">
                  Submitted to Focal Person
                </Text>
                <Text className="mt-1 text-base text-teal-800">
                  Today's feeding record has already been submitted.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className="px-6 py-4 pb-5">
        <View className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <View className="mb-2 flex-row items-start">
            <Check size={16} color="#10B981" className="mt-0.5" />
            <Text className="ml-2 flex-1 text-base text-gray-800">
              <Text className="font-semibold">Completed</Text> - child consumed
              the lunch meal as observed by the teacher
            </Text>
          </View>
          <View className="flex-row items-start">
            <X size={16} color="#EF4444" className="mt-0.5" />
            <Text className="ml-2 flex-1 text-base text-gray-800">
              <Text className="font-semibold">Missed</Text> - child did not eat,
              refused food, or was not present during lunch
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 pb-5">
        <Text className="mb-2 text-lg font-medium text-gray-700">
          Food Served (Menu) <Text className="text-red-500">*</Text>
        </Text>
        <Pressable
          onPress={() => !interactionDisabled && setShowMenuModal(true)}
          disabled={interactionDisabled}
          className={`flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm ${
            interactionDisabled ? "opacity-75" : ""
          }`}
        >
          <Text
            className={`text-lg font-medium ${
              foodServed ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {foodServed || "Select food menu"}
          </Text>
          {!interactionDisabled && <ChevronDown size={20} color="#9CA3AF" />}
        </Pressable>
      </View>

      <View className="px-6 pb-5">
        <View className="flex-row gap-2">
          <MiniStatCard label="Total" value={stats.total} icon={Check} variant="default" />
          <MiniStatCard
            label="Completed"
            value={stats.fed}
            icon={CheckCircle}
            variant="teal"
          />
          <MiniStatCard label="Missed" value={stats.missed} icon={X} variant="red" />
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by child name or student ID"
      />

      {!isReadOnly && (
        <View className="px-6 pb-5">
          <Pressable
            onPress={markAllAsCompleted}
            disabled={isSubmitting}
            className={`flex-row items-center justify-center rounded-xl border px-4 py-3 shadow-sm ${
              isSubmitting
                ? "border-emerald-300 bg-emerald-300"
                : "border-emerald-600 bg-emerald-600 active:opacity-85"
            }`}
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
      <ScreenShell
        className="flex-1 items-center justify-center bg-emerald-50"
        withKeyboardAvoiding={false}
      >
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text className="mt-4 text-gray-600">Loading children...</Text>
      </ScreenShell>
    );
  }

  if (children.length === 0) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader title="Record Feeding" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <CheckCircle size={64} color="#D1D5DB" />
          <Text className="mt-4 text-2xl font-bold text-gray-800">
            No Present Children
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Please mark attendance first to record feeding.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 rounded-lg bg-teal-600 px-6 py-3"
          >
            <Text className="font-semibold text-white">Back to Attendance</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        title="Record Feeding"
        subtitle={attendanceDateLabel}
        onBack={() => router.push("/(teacher)")}
      />

      <FlatList
        data={filteredChildren}
        keyExtractor={(item) => item._id}
        renderItem={renderChildCard}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={headerSection}
        ListEmptyComponent={
          searchQuery ? (
            <View className="mx-6 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-10">
              <Search size={48} color="#D1D5DB" />
              <Text className="mt-4 text-xl font-semibold text-gray-700">
                No child found
              </Text>
              <Text className="mt-2 text-center text-gray-500">
                Try searching with a different name
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View className="px-6 pb-4">
            <View className="mt-2 flex-row items-start rounded-2xl border border-teal-200 bg-teal-50 p-3.5">
              <CheckCircle size={16} color="#14B8A6" className="mt-0.5" />
              <Text className="ml-2 flex-1 text-base text-gray-700">
                Feeding records are teacher-observed, securely stored, and sent
                to the focal person for review.
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
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white">
            <View className="border-b border-gray-200 p-6">
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
                      foodServed === food
                        ? "border-teal-100 bg-teal-50"
                        : "border-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-lg ${
                        foodServed === food
                          ? "font-semibold text-teal-700"
                          : "text-gray-800"
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
          className={`items-center justify-center rounded-2xl py-4 shadow-md ${
            isSubmitting ? "bg-emerald-400" : "bg-emerald-600 active:opacity-90"
          }`}
        >
          <View className="flex-row items-center">
            {isSubmitting && <ActivityIndicator color="#FFFFFF" size="small" />}
            <Text
              className={`text-xl font-bold text-white ${
                isSubmitting ? "ml-2" : ""
              }`}
            >
              {isReadOnly
                ? "Back to Dashboard"
                : isSubmitting
                  ? "Submitting..."
                  : "Submit Feeding Record"}
            </Text>
          </View>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

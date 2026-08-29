import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  ChevronDown,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";
import { useCallback } from "react";
import { useTeacherFeeding } from "@/src/features/feeding/hooks";
import type { Child } from "@/src/api/parent.api";
import { useUnsavedChangesGuard } from "@/src/hooks/use-unsaved-changes-guard";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  SearchBar,
} from "@/src/components/ui";

export default function RecordFeeding() {
  const {
    router,
    children,
    loading,
    feedingStatus,
    foodServed,
    setFoodServed,
    searchQuery,
    setSearchQuery,
    showMenuModal,
    setShowMenuModal,
    showSuccessFeedback,
    dismissSuccessFeedback,
    isReadOnly,
    isSubmitting,
    attendanceDateLabel,
    interactionDisabled,
    filteredChildren,
    stats,
    hasUnsavedChanges,
    toggleChildFeeding,
    markAllAsCompleted,
    markAllAsMissed,
    handleSubmit,
    submitBeforeLeaving,
    foodMenuOptions,
  } = useTeacherFeeding();
  const completedPercentage =
    stats.total > 0 ? Math.round((stats.fed / stats.total) * 100) : 0;

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
            : "border-red-200 bg-red-50"
        } ${interactionDisabled ? "opacity-90" : ""}`}
      >
        <Pressable
          onPress={() => !interactionDisabled && toggleChildFeeding(child._id)}
          disabled={interactionDisabled}
          accessibilityRole="button"
          accessibilityLabel={`${child.lastName}, ${child.firstName}${
            child.middleName ? ` ${child.middleName}` : ""
          }, ${child.studentId ? `student ID ${child.studentId}, ` : ""}${
            feedingStatus[child._id] ? "Missed" : "Completed"
          }`}
          accessibilityHint={
            interactionDisabled
              ? "Submitted feeding records cannot be changed"
              : `Double tap to mark ${
                  feedingStatus[child._id] ? "Completed" : "Missed"
                }`
          }
          accessibilityState={{
            disabled: interactionDisabled,
            selected: !feedingStatus[child._id],
          }}
        >
          <View className="flex-row items-center p-4">
            <View
              className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
                !feedingStatus[child._id] ? "bg-teal-600" : "bg-red-500"
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
                  !feedingStatus[child._id] ? "bg-teal-100" : "bg-red-100"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    !feedingStatus[child._id] ? "text-teal-700" : "text-red-700"
                  }`}
                >
                  {!feedingStatus[child._id] ? "Completed" : "Missed"}
                </Text>
              </View>
            </View>

            <View className="items-center">
              {!feedingStatus[child._id] ? (
                <CheckCircle2 size={30} color="#0F766E" />
              ) : (
                <XCircle size={30} color="#B91C1C" />
              )}
            </View>
          </View>
        </Pressable>
      </View>
    ),
    [feedingStatus, interactionDisabled, toggleChildFeeding],
  );

  const headerSection = (
    <>
      <View className="px-6 pb-5 pt-4">
        <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text
                className="text-xl font-extrabold text-gray-900"
                accessibilityRole="header"
              >
                Feeding overview
              </Text>
              <Text className="mt-1 text-base text-gray-600">
                {completedPercentage}% of present children completed their meal
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
                width: `${completedPercentage}%` as `${number}%`,
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
                  {stats.fed}
                </Text>
                <Text className="text-sm font-semibold text-emerald-700">
                  Completed
                </Text>
              </View>
            </View>

            <View className="flex-1 flex-row items-center rounded-2xl bg-red-50 p-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <XCircle size={22} color="#B91C1C" />
              </View>
              <View className="ml-3">
                <Text className="text-2xl font-extrabold text-red-800">
                  {stats.missed}
                </Text>
                <Text className="text-sm font-semibold text-red-700">
                  Missed
                </Text>
              </View>
            </View>
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
          accessibilityRole="button"
          accessibilityLabel={
            foodServed ? `Food served: ${foodServed}` : "Select food menu"
          }
          accessibilityHint={
            interactionDisabled
              ? "Submitted feeding records cannot be changed"
              : "Opens the food menu options"
          }
          accessibilityState={{ disabled: interactionDisabled }}
          className={`min-h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm ${
            interactionDisabled ? "opacity-75" : ""
          }`}
        >
          <Text
            className={`flex-1 text-lg font-medium ${
              foodServed ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {foodServed || "Select food menu"}
          </Text>
          {!interactionDisabled && <ChevronDown size={20} color="#9CA3AF" />}
        </Pressable>
      </View>

      {!isReadOnly && (
        <View className="px-6 pb-5">
          <View className="flex-row gap-2">
            <Pressable
              onPress={markAllAsCompleted}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Mark all children as completed"
              accessibilityHint="Changes every child in the feeding list to Completed"
              accessibilityState={{ disabled: isSubmitting }}
              className={`flex-1 flex-row items-center justify-center rounded-xl border py-3 shadow-sm ${
                isSubmitting
                  ? "border-emerald-300 bg-emerald-300"
                  : "border-emerald-600 bg-emerald-600 active:opacity-85"
              }`}
            >
              <CheckCircle2 size={16} color="white" />
              <Text className="ml-1.5 text-base font-semibold text-white">
                Mark All Completed
              </Text>
            </Pressable>

            <Pressable
              onPress={markAllAsMissed}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Mark all children as missed"
              accessibilityHint="Changes every child in the feeding list to Missed"
              accessibilityState={{ disabled: isSubmitting }}
              className={`flex-1 flex-row items-center justify-center rounded-xl border py-3 shadow-sm ${
                isSubmitting
                  ? "border-slate-300 bg-slate-300"
                  : "border-slate-600 bg-slate-600 active:opacity-85"
              }`}
            >
              <XCircle size={16} color="white" />
              <Text className="ml-1.5 text-base font-semibold text-white">
                Mark All Missed
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
            Feeding list
          </Text>
          <View className="rounded-full bg-gray-200 px-3 py-1">
            <Text className="text-sm font-semibold text-gray-700">
              {children.length} {children.length === 1 ? "child" : "children"}
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-base leading-6 text-gray-600">
          {isReadOnly
            ? "Submitted feeding records are read-only."
            : "Tap a child to mark the meal Completed or Missed."}
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by child name or student ID"
      />
    </>
  );

  if (loading) {
    return (
      <ScreenShell className="flex-1 bg-gray-50" withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Record Feeding"
          onBack={() => router.back()}
        />
        <ScreenLoadingState
          title="Loading feeding records"
          message="Getting your class meal list ready."
        />
      </ScreenShell>
    );
  }

  if (children.length === 0) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Record Feeding"
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center px-6">
          <CheckCircle2 size={64} color="#D1D5DB" />
          <Text className="mt-4 text-2xl font-bold text-gray-800">
            No Present Children
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Please mark attendance first to record feeding.
          </Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant="teacherGradient"
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
              <CheckCircle2 size={16} color="#14B8A6" className="mt-0.5" />
              <Text className="ml-2 flex-1 text-base text-gray-700">
                Feeding records are teacher-observed, securely stored, and sent
                to the focal person for review.
              </Text>
            </View>
          </View>
        }
      />

      <Modal
        visible={showSuccessFeedback}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={dismissSuccessFeedback}
      >
        <View
          className="flex-1 bg-emerald-50 px-6"
          accessibilityViewIsModal
          accessibilityLabel="Feeding record submission confirmation"
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
              Feeding Record Submitted
            </Text>
            <Text
              className="mt-3 max-w-sm text-center text-lg leading-7 text-emerald-900"
              accessibilityLiveRegion="polite"
            >
              The feeding record has been submitted to the focal person.
            </Text>
          </View>

          <Pressable
            onPress={dismissSuccessFeedback}
            accessibilityRole="button"
            accessibilityLabel="Done"
            accessibilityHint="Returns to the submitted feeding record"
            className="mb-8 min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 shadow-md active:opacity-90"
          >
            <Text className="text-xl font-bold text-white">Done</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={showMenuModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View
          className="flex-1 justify-end bg-black/50"
          accessibilityViewIsModal
          accessibilityLabel="Food menu options"
        >
          <View className="rounded-t-3xl bg-white">
            <View className="border-b border-gray-200 p-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-800">
                  Select Food Menu
                </Text>
                <Pressable
                  onPress={() => setShowMenuModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close food menu"
                  className="min-h-12 justify-center px-2"
                >
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
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${food}`}
                    accessibilityState={{ selected: foodServed === food }}
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
          disabled={isSubmitting || isReadOnly}
          accessibilityRole="button"
          accessibilityLabel={
            isReadOnly
              ? "Feeding record submitted"
              : isSubmitting
                ? "Submitting feeding record"
                : "Submit feeding record"
          }
          accessibilityHint={
            isReadOnly
              ? "The feeding record has already been submitted"
              : "Submits today's feeding record to the focal person"
          }
          accessibilityState={{
            disabled: isSubmitting || isReadOnly,
            busy: isSubmitting,
          }}
          android_ripple={{ color: "transparent" }}
          className={`min-h-14 items-center justify-center rounded-2xl py-4 shadow-md ${
            isSubmitting || isReadOnly
              ? "bg-emerald-400"
              : "bg-emerald-600 active:opacity-90"
          }`}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isSubmitting && (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
                style={{ marginRight: 8 }}
              />
            )}
            <Text className="text-xl font-bold text-white">
              {isReadOnly
                ? "Feeding Record Submitted"
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

import { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  StatusBar,
  Pressable,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScreenLoadingState,
  TEACHER_HEADER_GRADIENT,
  OfflineStatusBanner,
} from "@/src/components/ui";
import { ViewGuardiansBottomSheet } from "../components/view-guardians-bottom-sheet";
import { ArchiveChildModal } from "../components/archive-child-modal";
import { ParentCredentialsModal } from "@/src/features/enrollment/components/ui/parent-credentials-modal";
import { GrowthHistoryBottomSheet } from "@/src/features/nutrition/components/growth-history-bottom-sheet";
import {
  TodayStatusCard,
  ChildQuickActions,
  ChildInfoCard,
  ParentInfoCard,
  ArchivedChildBanner,
} from "../components/details";
import { useArchiveChild, useRestoreChild } from "../hooks/use-archive-child";
import { useAndroidBackRoute } from "@/src/hooks/use-android-back-route";
import { useTeacherChildDetails } from "../hooks/use-teacher-child-details";
import { useParentCredentials } from "../hooks/use-parent-credentials";

export default function TeacherChildDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useAndroidBackRoute("/(teacher)/children");
  const { id } = useLocalSearchParams();
  const childId = typeof id === "string" ? id : null;

  const [isGuardiansSheetOpen, setIsGuardiansSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const { mutate: archiveChild, isPending: isArchiving } =
    useArchiveChild(childId);
  const { mutate: restoreChild, isPending: isRestoring } =
    useRestoreChild(childId);

  const details = useTeacherChildDetails(childId);
  const {
    child,
    feedingRecord,
    status,
    fullName,
    isInactive,
    isOffline,
    isLoading: loading,
    error,
    refetch,
  } = details;

  const credentials = useParentCredentials(childId, isOffline);
  const credentialsModal = credentials.modal;
  const isUpdatingStatus = isArchiving || isRestoring;

  const handleEditGuardian = (_guardian: unknown, index: number) => {
    setIsGuardiansSheetOpen(false);
    if (!childId) return;
    router.push({
      pathname: "/(teacher)/child-details/guardian",
      params: { childId, guardianIndex: String(index) },
    });
  };

  const handleAddGuardian = () => {
    setIsGuardiansSheetOpen(false);
    if (!childId) return;
    router.push({
      pathname: "/(teacher)/child-details/guardian",
      params: { childId },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <LinearGradient
          colors={TEACHER_HEADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 12 }}
          className="px-5 pb-6"
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.replace("/(teacher)/children")}
              className="mr-3"
            >
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Text className="text-3xl font-extrabold text-white">
              Child Details
            </Text>
          </View>
        </LinearGradient>
        <OfflineStatusBanner />
        <ScreenLoadingState
          variant="details"
          title="Loading child details"
          message="Getting the child’s profile and today’s records ready."
        />
      </SafeAreaView>
    );
  }

  if (!child) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <LinearGradient
          colors={TEACHER_HEADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 12 }}
          className="px-5 pb-6"
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.replace("/(teacher)/children")}
              className="mr-3"
            >
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Text className="text-3xl font-extrabold text-white">
              Child Details
            </Text>
          </View>
        </LinearGradient>
        <OfflineStatusBanner />
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
            <User size={28} color="#EF4444" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
            {error instanceof Error
              ? error.message
              : "Child details could not be loaded."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading child details"
            onPress={() => void refetch()}
            className="mt-4 min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-6"
          >
            <Text className="text-base font-bold text-white">Retry</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/(teacher)/children")}
            className="mt-3 min-h-12 items-center justify-center rounded-2xl border border-gray-300 bg-white px-6"
          >
            <Text className="text-base font-bold text-gray-700">
              Back to Children
            </Text>
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

      {/* HEADER */}
      <LinearGradient
        colors={TEACHER_HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12 }}
        className="px-5 pb-6"
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.replace("/(teacher)/children")}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3"
          >
            <ChevronLeft size={22} color="white" />
          </Pressable>

          <View className="flex-1">
            <Text
              className="text-2xl font-extrabold text-white"
              numberOfLines={1}
            >
              {fullName}
            </Text>
          </View>
        </View>
      </LinearGradient>
      <OfflineStatusBanner />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Status Card */}
        <TodayStatusCard status={status} feedingRecord={feedingRecord} />

        {/* Archived Child Notification Banner */}
        {isInactive && <ArchivedChildBanner child={child} />}

        {/* Quick Actions Row */}
        <ChildQuickActions
          childId={child._id}
          isInactive={isInactive}
          isOffline={isOffline}
          isUpdatingStatus={isUpdatingStatus}
          onEvaluate={() =>
            router.push({
              pathname: "/(teacher)/child-details/competencies/[childId]",
              params: { childId: child._id },
            })
          }
          onOpenHistory={() => setIsHistorySheetOpen(true)}
          onOpenGuardians={() => setIsGuardiansSheetOpen(true)}
          onEdit={() => router.push(`/(teacher)/edit-child/${childId}`)}
          onArchive={() => setIsArchiveModalOpen(true)}
          onRestore={() => restoreChild()}
        />

        {/* Child Information Card */}
        <ChildInfoCard child={child} />

        {/* Parent Information Card */}
        <ParentInfoCard
          child={child}
          isOffline={isOffline}
          isInactive={isInactive}
          isLoadingCredentials={credentials.isLoading}
          isResettingPassword={credentials.isResetting}
          onViewCredentials={credentials.view}
          onResetPassword={credentials.reset}
        />
      </ScrollView>

      {/* Sheets & Modals */}
      <ViewGuardiansBottomSheet
        childId={childId}
        childName={fullName}
        visible={isGuardiansSheetOpen}
        onClose={() => setIsGuardiansSheetOpen(false)}
        onEditGuardian={handleEditGuardian}
        onAddGuardian={handleAddGuardian}
        readOnly={isOffline || isInactive}
      />
      <ArchiveChildModal
        visible={isArchiveModalOpen}
        childName={fullName}
        loading={isArchiving}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={(input) => archiveChild(input)}
      />
      {isHistorySheetOpen && (
        <GrowthHistoryBottomSheet
          childId={childId || ""}
          childName={fullName}
          visible={isHistorySheetOpen}
          onClose={() => setIsHistorySheetOpen(false)}
        />
      )}

      {credentialsModal && (
        <ParentCredentialsModal
          visible={credentialsModal.visible}
          email={credentialsModal.email}
          tempPassword={credentialsModal.tempPassword}
          onClose={credentials.closeModal}
        />
      )}
    </SafeAreaView>
  );
}

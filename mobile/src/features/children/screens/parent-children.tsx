import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AlertCircle, Users } from "lucide-react-native";
import {
  RefreshableScrollView,
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "@/src/components/ui";
import { useParentChildrenData } from "@/src/features/children/hooks";
import { GrowthHistoryBottomSheet } from "@/src/features/nutrition/components/growth-history-bottom-sheet";
import { ViewGuardiansBottomSheet } from "@/src/features/children/components/view-guardians-bottom-sheet";
import { CompetencyHistoryBottomSheet } from "@/src/features/competencies";
import {
  ChildPersonalDetailsSection,
  ChildSchoolInfoSection,
  ChildSelectorPills,
  ChildTeacherContactSection,
  ParentChildProfileCard,
  ParentChildQuickActions,
  ParentNutritionSection,
} from "../components/parent";
import { getFullName } from "../utils/parent-child-formatters";

export default function ParentChildrenScreen() {
  const [showGuardians, setShowGuardians] = useState(false);
  const [showGrowthHistory, setShowGrowthHistory] = useState(false);
  const [showCompetencyHistory, setShowCompetencyHistory] = useState(false);

  const {
    children,
    selectedChild,
    setSelectedChildId,
    attendanceStatus,
    feedingStatus,
    loading,
    refreshing,
    error,
    loadScreenData,
    onRefresh,
    scrollBottomPadding,
  } = useParentChildrenData();

  const hasMultipleChildren = children.length > 1;
  const screenTitle = hasMultipleChildren ? "My Children" : "My Child";
  const screenSubtitle = hasMultipleChildren
    ? "Choose a child to view their profile"
    : "Profile and care information";

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="brandGradient"
          title="My Child"
          subtitle="Profile and care information"
        />
        <ScreenLoadingState
          variant="details"
          title="Loading child profile"
          message="Getting your child's information ready."
        />
      </ScreenShell>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="brandGradient"
          title={screenTitle}
          subtitle={screenSubtitle}
        />
        <View className="mx-5 rounded-3xl border border-red-100 bg-white p-5">
          <View className="flex-row items-start">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle size={22} color="#DC2626" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-gray-900">
                Could not load child information
              </Text>
              <Text className="mt-1 text-sm leading-5 text-gray-600">
                {error}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => loadScreenData()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading child information"
            className="mt-4 min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-4 active:opacity-80"
          >
            <Text className="text-base font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  /* ─── Main Content ─── */
  return (
    <ScreenShell edges={[]}>
      <ScreenHeader
        backgroundVariant="brandGradient"
        title={screenTitle}
        subtitle={screenSubtitle}
      />

      <RefreshableScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: scrollBottomPadding + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshColor="#14B8A6"
      >
        {children.length === 0 ? (
          /* ── Empty State ── */
          <View className="mt-2 rounded-3xl border border-gray-100 bg-white p-6">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <Users size={24} color="#0D9488" />
            </View>
            <Text className="mt-4 text-2xl font-bold text-gray-900">
              No linked children yet
            </Text>
            <Text className="mt-3 text-base leading-7 text-gray-600">
              Your child will appear here after their enrollment is completed.
              Contact your daycare center if you believe they should already be
              listed.
            </Text>
          </View>
        ) : selectedChild ? (
          <>
            {/* ── Multi-child Selector ── */}
            <ChildSelectorPills
              childrenList={children}
              selectedChildId={selectedChild._id}
              onSelectChild={setSelectedChildId}
            />

            {/* ── Profile Card & Today's Care ── */}
            <ParentChildProfileCard
              child={selectedChild}
              attendanceStatus={attendanceStatus}
              feedingStatus={feedingStatus}
            />

            {/* ── Quick Actions ── */}
            <ParentChildQuickActions
              onOpenCompetencies={() => setShowCompetencyHistory(true)}
              onOpenPickups={() => setShowGuardians(true)}
            />

            {/* ── School Information ── */}
            <ChildSchoolInfoSection child={selectedChild} />

            {/* ── Health & Nutrition ── */}
            <ParentNutritionSection
              childId={selectedChild._id}
              schoolYear={selectedChild.schoolYear}
              onOpenGrowthHistory={() => setShowGrowthHistory(true)}
            />

            {/* ── Child Personal Details & Home Address ── */}
            <ChildPersonalDetailsSection child={selectedChild} />

            {/* ── Teacher Contact ── */}
            <ChildTeacherContactSection child={selectedChild} />

            {/* ── Bottom Sheets ── */}
            <GrowthHistoryBottomSheet
              childId={selectedChild._id}
              childName={getFullName(selectedChild)}
              visible={showGrowthHistory}
              onClose={() => setShowGrowthHistory(false)}
            />

            <CompetencyHistoryBottomSheet
              childId={selectedChild._id}
              childName={getFullName(selectedChild)}
              visible={showCompetencyHistory}
              onClose={() => setShowCompetencyHistory(false)}
            />

            <ViewGuardiansBottomSheet
              childId={selectedChild._id}
              childName={getFullName(selectedChild)}
              visible={showGuardians}
              onClose={() => setShowGuardians(false)}
              readOnly={true}
            />
          </>
        ) : null}
      </RefreshableScrollView>
    </ScreenShell>
  );
}

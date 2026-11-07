import React, { useMemo, useState } from "react";
import { View, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  SearchBar,
  RefreshableScrollView,
  OfflineFeatureBanner,
} from "@/src/components/ui";
import { usePickupTeacher } from "../hooks/usePickupTeacher";
import type { PickupEligibleChild } from "@/src/api/api.types";
import {
  PickupEligibleChildCard,
  PickupEmptyState,
  PickupReleaseModal,
  PickupReminderBulkBar,
} from "../components";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";

export function TeacherPickupScreen() {
  const {
    eligibleChildren,
    isLoading,
    refetch,
    verifyCode,
    isVerifying,
    manualRelease,
    isReleasing,
    selectedChildIds,
    toggleChildSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    notifyParents,
    isNotifying,
    isOffline,
  } = usePickupTeacher();

  const [selectedChild, setSelectedChild] =
    useState<PickupEligibleChild | null>(null);
  const [code, setCode] = useState("");
  const [isManualRelease, setIsManualRelease] = useState(false);
  const [selectedGuardianIndex, setSelectedGuardianIndex] = useState<
    number | null
  >(null);
  const [isVisuallyVerified, setIsVisuallyVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);

  const isInSelectionMode = isSelectMode || selectedChildIds.length > 0;

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return eligibleChildren;
    const query = searchQuery.toLowerCase();
    return eligibleChildren.filter((child) => {
      const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [eligibleChildren, searchQuery]);

  const handleVerify = async () => {
    if (!selectedChild || code.length !== 6) return;
    try {
      await verifyCode({ childId: selectedChild._id, code });
      Alert.alert("Success", "Child successfully verified and released!");
      handleClose();
    } catch (error: unknown) {
      reportHandledError("pickup.code.verify", error);
      Alert.alert(
        "Verification Failed",
        getUserFriendlyErrorMessage(
          error,
          "The pickup code is invalid or has expired.",
        ),
      );
    }
  };

  const handleManualRelease = async () => {
    if (!selectedChild) return;
    try {
      const type = selectedGuardianIndex === null ? "parent" : "guardian";
      await manualRelease({
        childId: selectedChild._id,
        pickedUpByType: type,
        guardianIndex: selectedGuardianIndex,
        notes: "Teacher override",
        isVisuallyVerified,
      });
      Alert.alert("Success", "Child successfully released manually.");
      handleClose();
    } catch (error: unknown) {
      reportHandledError("pickup.manual-release", error);
      Alert.alert(
        "Release Failed",
        getUserFriendlyErrorMessage(
          error,
          "The manual release could not be completed. Please try again.",
        ),
      );
    }
  };

  const handleClose = () => {
    setSelectedChild(null);
    setCode("");
    setIsManualRelease(false);
    setSelectedGuardianIndex(null);
    setIsVisuallyVerified(false);
  };

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    if (selectedChildIds.length > 0) {
      toggleSelectAll();
    }
  };

  const handleNotifyParents = () => {
    if (isOffline || selectedChildIds.length === 0 || isNotifying) return;
    Alert.alert(
      "Notify Parents",
      `Send a pickup reminder to the parents of ${selectedChildIds.length} selected child${selectedChildIds.length === 1 ? "" : "ren"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            void notifyParents(selectedChildIds)
              .then((result) => {
                Alert.alert(
                  "Pickup Reminders Processed",
                  `${result.sent} in-app alert${result.sent === 1 ? "" : "s"} saved. ${result.pushDelivered} push delivered, ${result.pushFailed} push failed, and ${result.skipped} skipped.`,
                );
                setIsSelectMode(false);
              })
              .catch((error: unknown) => {
                reportHandledError("pickup.bulk-notification", error);
                Alert.alert(
                  "Unable to Notify Parents",
                  getUserFriendlyErrorMessage(
                    error,
                    "Pickup reminders could not be sent. Please try again.",
                  ),
                );
              });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="teacherGradient"
          title="Verify Pickup"
          subtitle="Ensure safe child release"
        />
        <ScreenLoadingState
          title="Loading eligible children"
          message="Fetching active attendance records for pickup verification."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell edges={[]}>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Verify Pickup"
        subtitle={`${eligibleChildren.length} Eligible for Pickup`}
      />

      {isOffline ? (
        <OfflineFeatureBanner
          title="Last known pickup status"
          description="Pickup information may have changed since this device was last synchronized. Verification and release require internet."
        />
      ) : null}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name..."
        containerClassName="px-5 pt-4 pb-2 bg-gray-50"
        iconSize={24}
        iconColor="#9CA3AF"
      />

      <PickupReminderBulkBar
        eligibleCount={eligibleChildren.length}
        selectedCount={selectedChildIds.length}
        isInSelectionMode={isInSelectionMode}
        isNotifying={isNotifying}
        isOffline={isOffline}
        onEnterSelectMode={() => setIsSelectMode(true)}
        onExitSelectMode={handleExitSelectMode}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onNotifyParents={handleNotifyParents}
      />

      <RefreshableScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        refreshColor="#0D9488"
      >
        <View className="px-5 pt-2">
          {filteredChildren.length === 0 ? (
            <PickupEmptyState searchQuery={searchQuery} />
          ) : (
            <View className="flex flex-col">
              {filteredChildren.map((child, index) => (
                <View
                  key={child._id}
                  className={index < filteredChildren.length - 1 ? "mb-3" : ""}
                >
                  <PickupEligibleChildCard
                    child={child}
                    selected={selectedChildIds.includes(child._id)}
                    selectionDisabled={isOffline || isNotifying}
                    onToggleSelected={() => toggleChildSelection(child._id)}
                    isSelectionActive={isInSelectionMode}
                    showCheckbox={isInSelectionMode}
                    onLongPress={() => {
                      setIsSelectMode(true);
                      toggleChildSelection(child._id);
                    }}
                    onPress={() => {
                      if (isOffline) {
                        Alert.alert(
                          "Connection required",
                          "Connect to the internet to perform this action.",
                        );
                        return;
                      }
                      setSelectedChild(child);
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </RefreshableScrollView>

      <PickupReleaseModal
        visible={!!selectedChild}
        child={selectedChild}
        code={code}
        isManualRelease={isManualRelease}
        isVerifying={isVerifying}
        isReleasing={isReleasing}
        selectedGuardianIndex={selectedGuardianIndex}
        isVisuallyVerified={isVisuallyVerified}
        onChangeCode={setCode}
        onVerify={handleVerify}
        onSwitchToManual={() => setIsManualRelease(true)}
        onSelectGuardian={(index) => {
          setSelectedGuardianIndex(index);
          setIsVisuallyVerified(false);
        }}
        onConfirmManualRelease={handleManualRelease}
        onBackToCode={() => {
          setIsManualRelease(false);
          setIsVisuallyVerified(false);
        }}
        onToggleVisualVerification={setIsVisuallyVerified}
        onClose={handleClose}
      />
    </ScreenShell>
  );
}

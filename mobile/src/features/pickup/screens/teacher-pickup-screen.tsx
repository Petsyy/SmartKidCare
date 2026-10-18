import React, { useMemo, useState } from "react";
import { View, Text, Alert, Modal, ScrollView, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { ShieldCheck, Search, Send } from "lucide-react-native";
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
  PickupChildInfoCard,
  PickupCodeVerifier,
  PickupManualOverridePanel,
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
    allEligibleSelected,
    toggleChildSelection,
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
              })
              .catch((error: unknown) => {
                reportHandledError("pickup.bulk-notification", error);
                Alert.alert(
                  "Unable to Notify Parents",
                  getUserFriendlyErrorMessage(error, "Pickup reminders could not be sent. Please try again."),
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

      {eligibleChildren.length > 0 ? (
        <View className="border-b border-gray-200 bg-white px-5 py-3">
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={allEligibleSelected ? "Clear child selection" : "Select all eligible children"}
              accessibilityState={{ checked: allEligibleSelected, disabled: isNotifying }}
              disabled={isNotifying}
              onPress={toggleSelectAll}
              className="min-h-11 justify-center rounded-xl px-2"
            >
              <Text className="text-sm font-black text-teal-700">
                {allEligibleSelected ? "Clear Selection" : "Select All"}
              </Text>
            </Pressable>
            <Text className="text-sm font-bold text-gray-500">
              {selectedChildIds.length} selected
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notify selected parents"
            accessibilityState={{ disabled: isOffline || isNotifying || selectedChildIds.length === 0, busy: isNotifying }}
            disabled={isOffline || isNotifying || selectedChildIds.length === 0}
            onPress={handleNotifyParents}
            className={`mt-2 min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 ${isOffline || isNotifying || selectedChildIds.length === 0 ? "opacity-40" : "opacity-100"}`}
          >
            <Send size={16} color="#FFFFFF" />
            <Text className="text-sm font-black text-white">
              {isNotifying ? "Sending..." : "Notify Parents"}
            </Text>
          </Pressable>
        </View>
      ) : null}

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
            <View className="items-center justify-center py-16 px-6">
              {searchQuery ? (
                <>
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                    <Search size={40} color="#9CA3AF" />
                  </View>
                  <Text className="text-2xl font-black text-gray-800 mb-2 text-center">
                    No Children Found
                  </Text>
                  <Text className="text-lg font-bold text-gray-500 text-center leading-7">
                    No children match your search.{"\n"}
                    Try a different search term.
                  </Text>
                </>
              ) : (
                <>
                  <View className="h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 mb-4">
                    <ShieldCheck size={56} color="#14B8A6" />
                  </View>
                  <Text className="text-2xl font-black text-gray-800 mb-2 text-center">
                    All Clear
                  </Text>
                  <Text className="text-lg font-bold text-gray-500 text-center leading-7">
                    All present children have been picked up{"\n"}
                    or none are currently signed in.
                  </Text>
                </>
              )}
            </View>
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

      {/* Verification Modal */}
      <Modal
        visible={!!selectedChild}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={handleClose} />
          <View className="bg-gray-50 rounded-t-3xl overflow-hidden flex-1 mt-20">
            {/* Modal Header */}
            <View
              className="bg-white px-5 pt-6 pb-4 border-b border-gray-100 flex-row justify-between items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text className="text-2xl font-black text-gray-900">
                Release Authorization
              </Text>
              <Pressable
                onPress={handleClose}
                className="px-4 py-2 rounded-full bg-gray-100 active:bg-gray-200"
                accessibilityRole="button"
                accessibilityLabel="Cancel and close"
              >
                <Text className="text-gray-600 font-black text-sm">Cancel</Text>
              </Pressable>
            </View>

            {selectedChild && (
              <ScrollView
                className="flex-1"
                contentContainerClassName="p-5 pb-8"
                showsVerticalScrollIndicator={false}
              >
                <PickupChildInfoCard child={selectedChild} />

                {!isManualRelease ? (
                  <PickupCodeVerifier
                    code={code}
                    onChangeCode={setCode}
                    onVerify={handleVerify}
                    isVerifying={isVerifying}
                    onSwitchToManual={() => setIsManualRelease(true)}
                  />
                ) : (
                  <PickupManualOverridePanel
                    key={`${selectedChild._id}:${selectedGuardianIndex ?? "parent"}`}
                    childId={selectedChild._id}
                    parent={selectedChild.parent}
                    guardians={selectedChild.authorizedPickupPersons || []}
                    selectedGuardianIndex={selectedGuardianIndex}
                    onSelectGuardian={(index) => {
                      setSelectedGuardianIndex(index);
                      setIsVisuallyVerified(false);
                    }}
                    onConfirm={handleManualRelease}
                    isReleasing={isReleasing}
                    onBack={() => {
                      setIsManualRelease(false);
                      setIsVisuallyVerified(false);
                    }}
                    isVisuallyVerified={isVisuallyVerified}
                    onToggleVisualVerification={setIsVisuallyVerified}
                  />
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

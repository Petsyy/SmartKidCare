import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, Search } from "lucide-react-native";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  SearchBar,
} from "@/src/components/ui";
import { usePickupTeacher } from "../hooks/usePickupTeacher";
import type { PickupEligibleChild } from "@/src/api/api.types";
import {
  PickupEligibleChildCard,
  PickupChildInfoCard,
  PickupCodeVerifier,
  PickupManualOverridePanel,
} from "../components";
import { Pressable } from "react-native";

export function TeacherPickupScreen() {
  const {
    eligibleChildren,
    isLoading,
    refetch,
    verifyCode,
    isVerifying,
    manualRelease,
    isReleasing,
  } = usePickupTeacher();
  
  const insets = useSafeAreaInsets();

  const [selectedChild, setSelectedChild] =
    useState<PickupEligibleChild | null>(null);
  const [code, setCode] = useState("");
  const [isManualRelease, setIsManualRelease] = useState(false);
  const [selectedGuardianIndex, setSelectedGuardianIndex] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return eligibleChildren;
    const query = searchQuery.toLowerCase();
    return eligibleChildren.filter((child) => {
      const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
      const studentId = child.studentId.toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
    });
  }, [eligibleChildren, searchQuery]);

  const handleVerify = async () => {
    if (!selectedChild || code.length !== 6) return;
    try {
      await verifyCode({ childId: selectedChild._id, code });
      Alert.alert("Success", "Child successfully verified and released!");
      handleClose();
    } catch (e: any) {
      Alert.alert(
        "Verification Failed",
        e.message || "Invalid or expired code.",
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
      });
      Alert.alert("Success", "Child successfully released manually.");
      handleClose();
    } catch (e: any) {
      Alert.alert(
        "Release Failed",
        e.message || "Could not complete manual release.",
      );
    }
  };

  const handleClose = () => {
    setSelectedChild(null);
    setCode("");
    setIsManualRelease(false);
    setSelectedGuardianIndex(null);
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

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name or student ID..."
        containerClassName="px-5 pt-4 pb-2 bg-gray-50"
        iconSize={24}
        iconColor="#9CA3AF"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#0D9488"
          />
        }
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
                    onPress={() => setSelectedChild(child)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

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
              className="flex-1 p-5"
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
                  parent={selectedChild.parent}
                  guardians={selectedChild.authorizedPickupPersons || []}
                  selectedGuardianIndex={selectedGuardianIndex}
                  onSelectGuardian={setSelectedGuardianIndex}
                  onConfirm={handleManualRelease}
                  isReleasing={isReleasing}
                  onBack={() => setIsManualRelease(false)}
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

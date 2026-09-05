import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ShieldCheck, KeyRound } from "lucide-react-native";
import {
  ScreenHeader,
  ScreenShell,
  ScreenLoadingState,
} from "@/src/components/ui";
import { useQuery } from "@tanstack/react-query";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import { usePickupParent } from "../hooks/usePickupParent";
import { useGuardians } from "@/src/features/children/hooks/useGuardian";
import { GuardianList } from "@/src/features/children/components/guardian-list";
import {
  PickupActiveCode,
  PickupReleasedBanner,
  PickupPersonSelector,
} from "../components";

export function ParentPickupScreen() {
  const { data: children = [], isLoading: loadingChildren } = useQuery<Child[]>(
    {
      queryKey: ["parent", "my-children"],
      queryFn: getMyChildren,
    },
  );
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0]._id);
    }
  }, [children, selectedChildId]);

  if (loadingChildren) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant="brandGradient"
          title="Safe Pickup"
          subtitle="Manage child pickup authorization"
        />
        <ScreenLoadingState
          title="Loading pickup status"
          message="Checking authorized guardians and active pickup codes."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell withKeyboardAvoiding={false}>
      <ScreenHeader
        backgroundVariant="brandGradient"
        title="Safe Pickup"
        subtitle="Manage child pickup authorization"
      />
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {children.length === 0 ? (
          <View className="items-center justify-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            <View className="h-16 w-16 rounded-full bg-teal-50 items-center justify-center mb-3">
              <ShieldCheck size={32} color="#0D9488" />
            </View>
            <Text className="text-gray-900 font-bold text-xl text-center">
              No Children Found
            </Text>
            <Text className="text-gray-500 text-center mt-2 text-base leading-6 px-4">
              You need to have an enrolled child to use Safe Pickup and generate
              verification codes.
            </Text>
          </View>
        ) : (
          <>
            {/* Child Tab Switcher */}
            {children.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {children.map((child) => (
                  <Pressable
                    key={child._id}
                    onPress={() => setSelectedChildId(child._id)}
                    className={`mr-3 px-6 py-3 rounded-full border flex-row items-center ${
                      selectedChildId === child._id
                        ? "bg-teal-600 border-teal-600 shadow-sm"
                        : "bg-white border-gray-200"
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${child.firstName}`}
                    accessibilityState={{
                      selected: selectedChildId === child._id,
                    }}
                  >
                    <View
                      className={`h-2 w-2 rounded-full mr-2 ${
                        selectedChildId === child._id
                          ? "bg-white"
                          : "bg-teal-500"
                      }`}
                    />
                    <Text
                      className={`font-bold text-sm ${
                        selectedChildId === child._id
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {child.firstName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {selectedChildId && (
              <>
                <PickupManager childId={selectedChildId} />

                {/* Authorized Guardians Section */}
                <View className="mb-6 overflow-hidden rounded-3xl border bg-white shadow-sm border-teal-100">
                  <View className="h-1.5 rounded-t-3xl bg-teal-600" />
                  <View className="p-5">
                    <View className="flex-row items-center border-b border-gray-100 pb-4 mb-4">
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
                        <ShieldCheck size={24} color="#0D9488" />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text
                          className="text-xl font-black text-gray-900"
                          accessibilityRole="header"
                        >
                          Authorized Guardians
                        </Text>
                        <Text className="text-sm text-gray-500 mt-0.5">
                          Approved persons allowed to pick up your child
                        </Text>
                      </View>
                    </View>
                    <GuardianList childId={selectedChildId} readOnly={false} />
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// PickupManager — handles code generation state for a single child
// ---------------------------------------------------------------------------

function PickupManager({ childId }: { childId: string }) {
  const { statusData, isLoading, requestCode, isRequesting } =
    usePickupParent(childId);
  const { guardians } = useGuardians(childId);
  const [selectedGuardianIndex, setSelectedGuardianIndex] = useState<
    number | null
  >(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiresAt.getTime() - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
        setGeneratedCode(null);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGenerateCode = async () => {
    try {
      const res = await requestCode(selectedGuardianIndex);
      setGeneratedCode(res.code);
      setExpiresAt(new Date(res.expiresAt));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to generate pickup code.");
    }
  };

  if (isLoading) {
    return (
      <View className="bg-white border border-gray-100 rounded-3xl p-8 items-center justify-center my-2 shadow-sm">
        <ActivityIndicator size="small" color="#0D9488" />
        <Text className="text-gray-500 text-xs font-medium mt-2">
          Checking pickup status...
        </Text>
      </View>
    );
  }

  const isReleased = statusData?.status === "released";

  if (isReleased) {
    return <PickupReleasedBanner pickup={statusData.pickup} />;
  }

  return (
    <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm mb-5">
      {generatedCode ? (
        <PickupActiveCode
          code={generatedCode}
          timeLeft={timeLeft}
          isRequesting={isRequesting}
          onRegenerate={handleGenerateCode}
        />
      ) : (
        <View>
          <View className="flex-row items-center mb-2">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 mr-3">
              <KeyRound size={22} color="#0D9488" />
            </View>
            <Text className="text-2xl font-black text-gray-900">
              Generate Pickup Code
            </Text>
          </View>
          <Text className="text-gray-600 text-base leading-6 mb-6 ml-2">
            Create a secure 6-digit PIN for today's pickup. The code will expire
            in 60 minutes.
          </Text>

          <PickupPersonSelector
            parent={{ firstName: "Me", lastName: "(Parent)" }}
            guardians={guardians}
            selectedGuardianIndex={selectedGuardianIndex}
            onSelect={setSelectedGuardianIndex}
            parentSubtitle="Primary Account Holder"
          />

          <Pressable
            onPress={handleGenerateCode}
            disabled={isRequesting}
            className={`mt-6 items-center justify-center py-5 px-6 rounded-2xl flex-row shadow-md active:opacity-90 ${
              isRequesting ? "bg-teal-400" : "bg-teal-600"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Generate secure pickup code"
          >
            {isRequesting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <KeyRound size={22} color="white" />
                <Text className="text-white font-black text-lg ml-2.5 tracking-wide">
                  Generate Secure Code
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

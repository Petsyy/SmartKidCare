import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { PickupEligibleChild } from "@/src/api/api.types";
import { PickupChildInfoCard } from "./pickup-child-info-card";
import { PickupCodeVerifier } from "./pickup-code-verifier";
import { PickupManualOverridePanel } from "./pickup-manual-override-panel";

interface PickupReleaseModalProps {
  visible: boolean;
  child: PickupEligibleChild | null;
  code: string;
  isManualRelease: boolean;
  isVerifying: boolean;
  isReleasing: boolean;
  selectedGuardianIndex: number | null;
  isVisuallyVerified: boolean;
  onChangeCode: (code: string) => void;
  onVerify: () => void;
  onSwitchToManual: () => void;
  onSelectGuardian: (index: number | null) => void;
  onConfirmManualRelease: () => void;
  onBackToCode: () => void;
  onToggleVisualVerification: (value: boolean) => void;
  onClose: () => void;
}

export function PickupReleaseModal({
  visible,
  child,
  code,
  isManualRelease,
  isVerifying,
  isReleasing,
  selectedGuardianIndex,
  isVisuallyVerified,
  onChangeCode,
  onVerify,
  onSwitchToManual,
  onSelectGuardian,
  onConfirmManualRelease,
  onBackToCode,
  onToggleVisualVerification,
  onClose,
}: PickupReleaseModalProps) {
  if (!child) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="mt-20 flex-1 overflow-hidden rounded-t-3xl bg-gray-50">
          {/* Modal Header */}
          <View
            className="flex-row items-center justify-between border-b border-gray-100 bg-white px-5 pb-4 pt-6"
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
              onPress={onClose}
              className="rounded-full bg-gray-100 px-4 py-2 active:bg-gray-200"
              accessibilityRole="button"
              accessibilityLabel="Cancel and close"
            >
              <Text className="text-sm font-black text-gray-600">Cancel</Text>
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="p-5 pb-8"
            showsVerticalScrollIndicator={false}
          >
            <PickupChildInfoCard child={child} />

            {!isManualRelease ? (
              <PickupCodeVerifier
                code={code}
                onChangeCode={onChangeCode}
                onVerify={onVerify}
                isVerifying={isVerifying}
                onSwitchToManual={onSwitchToManual}
              />
            ) : (
              <PickupManualOverridePanel
                key={`${child._id}:${selectedGuardianIndex ?? "parent"}`}
                childId={child._id}
                parent={child.parent}
                guardians={child.authorizedPickupPersons || []}
                selectedGuardianIndex={selectedGuardianIndex}
                onSelectGuardian={onSelectGuardian}
                onConfirm={onConfirmManualRelease}
                isReleasing={isReleasing}
                onBack={onBackToCode}
                isVisuallyVerified={isVisuallyVerified}
                onToggleVisualVerification={onToggleVisualVerification}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


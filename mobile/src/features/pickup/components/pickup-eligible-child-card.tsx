import React from "react";
import { View, Text, Pressable } from "react-native";
import { User, ChevronRight, Phone } from "lucide-react-native";
import type { PickupEligibleChild } from "@/src/api/api.types";
import { PickupSelectionCheckbox } from "./pickup-selection-checkbox";

interface Props {
  child: PickupEligibleChild;
  onPress: () => void;
  onLongPress?: () => void;
  selected: boolean;
  selectionDisabled?: boolean;
  onToggleSelected: () => void;
  isSelectionActive?: boolean;
  showCheckbox?: boolean;
}

export function PickupEligibleChildCard({
  child,
  onPress,
  onLongPress,
  selected,
  selectionDisabled = false,
  onToggleSelected,
  isSelectionActive = false,
  showCheckbox = false,
}: Props) {
  const guardianCount =
    child.authorizedPickupPersons?.filter((g) => g.isActive !== false).length ??
    0;

  const handleCardPress = () => {
    if (isSelectionActive) {
      if (!selectionDisabled) {
        onToggleSelected();
      }
    } else {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handleCardPress}
      onLongPress={() => {
        if (!isSelectionActive && onLongPress) {
          onLongPress();
        }
      }}
      className={`overflow-hidden rounded-3xl border active:scale-[0.98] ${
        selected
          ? "border-teal-500 bg-teal-50/70"
          : "border-gray-200 bg-white"
      }`}
      style={{
        borderColor: selected ? "#14B8A6" : "#E5E7EB",
        backgroundColor: selected ? "#F0FDFA" : "#FFFFFF",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: selected ? 0.08 : 0.04,
        shadowRadius: 10,
        elevation: 3,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Child ${child.firstName} ${child.lastName}${selected ? ", selected" : ""}`}
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            {showCheckbox ? (
              <PickupSelectionCheckbox
                selected={selected}
                disabled={selectionDisabled}
                childName={`${child.firstName} ${child.lastName}`}
                onToggle={onToggleSelected}
                className="-ml-1 mr-2"
              />
            ) : null}

            <View
              className={`h-14 w-14 items-center justify-center rounded-2xl border mr-3 ${
                selected
                  ? "border-teal-300 bg-teal-100"
                  : "border-teal-100 bg-teal-50"
              }`}
            >
              <User size={28} color="#0D9488" />
            </View>

            <View className="flex-1 pr-2">
              <Text
                className="text-xl font-black text-gray-900"
                numberOfLines={1}
              >
                {child.firstName} {child.lastName}
              </Text>
              {child.parent ? (
                <Text className="mt-0.5 text-sm font-semibold text-gray-500" numberOfLines={1}>
                  Parent: {child.parent.firstName} {child.parent.lastName}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Status Chips */}
        <View className="mt-3.5 flex-row items-center gap-2">
          <View className="rounded-full bg-teal-50 px-3.5 py-1.5 border border-teal-100">
            <Text className="text-sm font-black text-teal-700">Present</Text>
          </View>
          <View className="rounded-full bg-blue-50 px-3.5 py-1.5 border border-blue-100">
            <Text className="text-sm font-black text-blue-700">
              {guardianCount} Guardian{guardianCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View
          className={`mt-3.5 flex-row items-center justify-between border-t pt-3 ${
            selected ? "border-teal-200/70" : "border-gray-100"
          }`}
        >
          {child.parent?.phone ? (
            <View className="flex-row items-center">
              <Phone size={15} color="#6B7280" />
              <Text className="ml-2 text-sm font-bold text-gray-600">
                {child.parent.phone}
              </Text>
            </View>
          ) : (
            <Text className="text-sm text-gray-400">No phone on file</Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Verify and release ${child.firstName} ${child.lastName}`}
            onPress={(e) => {
              e.stopPropagation();
              onPress();
            }}
            className="flex-row items-center rounded-full bg-teal-600 px-3.5 py-1.5 active:bg-teal-700"
          >
            <Text className="text-xs font-black text-white mr-1">Verify</Text>
            <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { PickupPersonCard } from "./PickupPersonCard";
import type { Guardian } from "@/src/api/api.types";

interface ParentInfo {
  firstName: string;
  lastName: string;
}

interface PickupPersonSelectorProps {
  parent: ParentInfo | null | undefined;
  guardians: Guardian[];
  selectedGuardianIndex: number | null;
  onSelect: (guardianIndex: number | null) => void;
  parentSubtitle?: string;
  sectionLabel?: string;
}

export function PickupPersonSelector({
  parent,
  guardians,
  selectedGuardianIndex,
  onSelect,
  parentSubtitle = "Parent • Primary Account",
  sectionLabel = "Who is picking up?",
}: PickupPersonSelectorProps) {
  const activeGuardians = guardians
    .map((guardian, index) => ({ guardian, index }))
    .filter(({ guardian }) => guardian.isActive !== false);

  return (
    <View>
      <Text className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4">
        {sectionLabel}
      </Text>

      {/* Parent option */}
      {parent && (
        <PickupPersonCard
          name={`${parent.firstName} ${parent.lastName}`}
          subtitle={parentSubtitle}
          isSelected={selectedGuardianIndex === null}
          onPress={() => onSelect(null)}
          variant="parent"
        />
      )}

      {/* Guardian options */}
      {activeGuardians.map(({ guardian, index }) => {
        const relationshipLabel =
          guardian.relationship === "Other" && guardian.customRelationship
            ? guardian.customRelationship
            : guardian.relationship;
        return (
          <PickupPersonCard
            key={guardian._id || `guardian-${index}`}
            name={`${guardian.firstName} ${guardian.lastName}`}
            subtitle={`${relationshipLabel} • ${guardian.phone}`}
            isSelected={selectedGuardianIndex === index}
            onPress={() => onSelect(index)}
            variant="guardian"
          />
        );
      })}
    </View>
  );
}

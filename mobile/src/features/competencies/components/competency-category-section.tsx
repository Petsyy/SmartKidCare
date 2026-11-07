import { Text, View } from "react-native";
import { CompetencyItem } from "./competency-item";
import type {
  CompetencyDefinition,
  CompetencyLevel,
} from "../types";

interface CompetencyCategorySectionProps {
  category: string;
  definitions: CompetencyDefinition[];
  levels: Record<string, CompetencyLevel>;
  remarks: Record<string, string>;
  disabled: boolean;
  onLevelChange: (definitionId: string, level: CompetencyLevel) => void;
  onRemarksChange: (definitionId: string, remarks: string) => void;
}

export function CompetencyCategorySection({
  category,
  definitions,
  levels,
  remarks,
  disabled,
  onLevelChange,
  onRemarksChange,
}: CompetencyCategorySectionProps) {
  return (
    <View className="mb-4 rounded-3xl border border-gray-200 bg-white p-4">
      <Text className="text-xl font-extrabold text-gray-900">
        {category}
      </Text>
      {definitions.map((definition) => (
        <CompetencyItem
          key={definition._id}
          definition={definition}
          level={levels[definition._id]}
          remarks={remarks[definition._id] || ""}
          disabled={disabled}
          onLevelChange={(level) => onLevelChange(definition._id, level)}
          onRemarksChange={(value) => onRemarksChange(definition._id, value)}
        />
      ))}
    </View>
  );
}


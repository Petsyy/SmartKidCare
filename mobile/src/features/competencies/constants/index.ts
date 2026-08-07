import type { CompetencyLevel } from "../types";

export const COMPETENCY_LEVELS: Array<{
  value: CompetencyLevel;
  label: string;
  color: string;
  selectedColor: string;
}> = [
  {
    value: "not_demonstrated",
    label: "Not Yet",
    color: "#FEE2E2",
    selectedColor: "#DC2626",
  },
  {
    value: "emerging",
    label: "Emerging",
    color: "#FEF3C7",
    selectedColor: "#D97706",
  },
  {
    value: "developing",
    label: "Developing",
    color: "#DBEAFE",
    selectedColor: "#2563EB",
  },
  {
    value: "achieved",
    label: "Achieved",
    color: "#D1FAE5",
    selectedColor: "#059669",
  },
];

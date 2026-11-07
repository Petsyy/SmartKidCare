import type { LucideIcon } from "lucide-react-native";

export type TeacherOverviewStatTone = "sky" | "emerald" | "rose" | "orange";

export interface TeacherOverviewStatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  caption: string;
  tone: TeacherOverviewStatTone;
  muted?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress?: () => void;
}

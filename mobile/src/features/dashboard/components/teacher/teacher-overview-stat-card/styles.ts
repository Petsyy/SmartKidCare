import type { TeacherOverviewStatTone } from "./types";

interface TeacherOverviewStatToneStyles {
  borderClass: string;
  iconContainerClass: string;
  iconColor: string;
  valueClass: string;
}

export const TEACHER_OVERVIEW_STAT_TONE_STYLES: Record<
  TeacherOverviewStatTone,
  TeacherOverviewStatToneStyles
> = {
  sky: {
    borderClass: "border-sky-100",
    iconContainerClass: "bg-sky-100",
    iconColor: "#0369A1",
    valueClass: "text-sky-900",
  },
  emerald: {
    borderClass: "border-emerald-100",
    iconContainerClass: "bg-emerald-100",
    iconColor: "#047857",
    valueClass: "text-emerald-900",
  },
  rose: {
    borderClass: "border-rose-100",
    iconContainerClass: "bg-rose-100",
    iconColor: "#BE123C",
    valueClass: "text-rose-900",
  },
  orange: {
    borderClass: "border-orange-100",
    iconContainerClass: "bg-orange-100",
    iconColor: "#C2410C",
    valueClass: "text-orange-900",
  },
};

export const TEACHER_OVERVIEW_STAT_MUTED_VALUE_CLASS = "text-gray-400";

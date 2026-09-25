import type { ConcernCategory, ConcernStatus } from "@/src/api/api.types";

export const CONCERN_CATEGORY_OPTIONS: {
  value: ConcernCategory;
  label: string;
}[] = [
  { value: "child_safety", label: "Child Safety" },
  { value: "attendance", label: "Attendance" },
  { value: "feeding_nutrition", label: "Feeding & Nutrition" },
  { value: "child_records", label: "Child Records" },
  { value: "daycare_service", label: "Teacher or Daycare Service" },
  { value: "feedback_suggestion", label: "Feedback or Suggestion" },
  { value: "other", label: "Other" },
];

export const concernCategoryLabel = (category: ConcernCategory) =>
  CONCERN_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;

export const concernStatusLabel = (status: ConcernStatus) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const concernStatusClasses: Record<ConcernStatus, string> = {
  new: "bg-rose-100 text-rose-700",
  acknowledged: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-200 text-gray-700",
};

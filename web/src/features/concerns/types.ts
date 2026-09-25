export type ConcernCategory =
  | "child_safety"
  | "attendance"
  | "feeding_nutrition"
  | "child_records"
  | "daycare_service"
  | "feedback_suggestion"
  | "other";

export type ConcernStatus =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed";

export type ConcernPerson = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role?: "parent" | "barangay_captain";
};

export type ConcernChild = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId?: string;
};

export type ConcernMessage = {
  _id: string;
  sender: ConcernPerson | string;
  senderRole: "parent" | "barangay_captain";
  body: string;
  createdAt: string;
};

export type ConcernHistoryItem = {
  _id: string;
  previousStatus: ConcernStatus | null;
  newStatus: ConcernStatus;
  changedBy: ConcernPerson | string;
  changedByRole: "parent" | "barangay_captain";
  note?: string;
  changedAt: string;
};

export type ConcernSummary = {
  _id: string;
  parent: ConcernPerson;
  child: ConcernChild;
  category: ConcernCategory;
  subject: string;
  status: ConcernStatus;
  messages: ConcernMessage[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ConcernDetail = ConcernSummary & {
  statusHistory: ConcernHistoryItem[];
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
};

export type ConcernPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const CONCERN_CATEGORIES: Array<{ value: ConcernCategory; label: string }> = [
  { value: "child_safety", label: "Child Safety" },
  { value: "attendance", label: "Attendance" },
  { value: "feeding_nutrition", label: "Feeding & Nutrition" },
  { value: "child_records", label: "Child Records" },
  { value: "daycare_service", label: "Teacher or Daycare Service" },
  { value: "feedback_suggestion", label: "Feedback or Suggestion" },
  { value: "other", label: "Other" },
];

export const CONCERN_STATUSES: Array<{ value: ConcernStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const concernCategoryLabel = (value: ConcernCategory) =>
  CONCERN_CATEGORIES.find((item) => item.value === value)?.label ?? value;

export const concernStatusLabel = (value: ConcernStatus) =>
  CONCERN_STATUSES.find((item) => item.value === value)?.label ?? value;

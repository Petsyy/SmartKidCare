import type { Child } from "@/src/api/parent.api";

export const NOT_PROVIDED = "Not provided";

export const getFullName = (child: Child): string => {
  const middle = child.middleName ? ` ${child.middleName}` : "";
  return `${child.firstName}${middle} ${child.lastName}`
    .replace(/\s+/g, " ")
    .trim();
};

export const toTitleCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getChildDetails = (child: Child): string => {
  const age = `${child.age} ${child.age === 1 ? "year" : "years"} old`;
  const gender = child.gender ? toTitleCase(child.gender) : null;
  return [age, gender].filter(Boolean).join(" · ");
};

export const getTeacherFullName = (child: Child): string => {
  if (!child.teacher) return "Not assigned yet";
  const middle = child.teacher.middleName ? ` ${child.teacher.middleName}` : "";
  return `${child.teacher.firstName}${middle} ${child.teacher.lastName}`
    .replace(/\s+/g, " ")
    .trim();
};

export const getEnrollmentStatus = (
  status: string,
): { label: string; isActive: boolean } => {
  const normalized = status?.trim().toLowerCase();
  const isActive = ["active", "enrolled", "approved"].includes(normalized);

  if (isActive) return { label: "Enrolled", isActive: true };
  if (!normalized) {
    return { label: "Enrollment status unavailable", isActive: false };
  }

  return { label: toTitleCase(status), isActive: false };
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return NOT_PROVIDED;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
};


import type {
  ReportAgeBreakdownItem,
  ReportGenderBreakdown,
  ReportStudentListItem,
} from "../types/reports.types";

export type ChildReportRecord = {
  _id: { toString(): string } | string;
  firstName: string;
  lastName: string;
  age: number;
  gender: "male" | "female";
  status: string;
  studentId?: string;
  programType: string;
  schoolYear: string;
  enrollmentDate?: Date | string | null;
  teacher?: { firstName?: string; lastName?: string } | null;
  daycareCenter?: { name?: string } | null;
};

export type GenderAggregateRow = {
  _id: "male" | "female" | null;
  count: number;
};

export type AgeAggregateRow = {
  _id: number | null;
  count: number;
};

const toPercentage = (value: number, total: number) =>
  total ? Math.round((value / total) * 100) : 0;

const formatPersonName = (
  person?: { firstName?: string; lastName?: string } | null,
) => {
  const fullName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "Unassigned";
};

export const buildGenderBreakdown = (
  rows: GenderAggregateRow[],
  total: number,
): ReportGenderBreakdown => {
  const male = rows.find((row) => row._id === "male")?.count ?? 0;
  const female = rows.find((row) => row._id === "female")?.count ?? 0;

  return {
    male,
    female,
    total,
    malePercentage: toPercentage(male, total),
    femalePercentage: toPercentage(female, total),
  };
};

export const buildAgeBreakdown = (
  rows: AgeAggregateRow[],
): ReportAgeBreakdownItem[] =>
  rows
    .filter((row) => Number.isFinite(row._id))
    .sort((a, b) => Number(a._id) - Number(b._id))
    .map((row) => ({ age: Number(row._id), count: row.count }));

export const buildReportDemographics = (
  children: Array<Pick<ChildReportRecord, "age" | "gender">>,
): {
  genderBreakdown: ReportGenderBreakdown;
  ageBreakdown: ReportAgeBreakdownItem[];
} => {
  const male = children.filter((child) => child.gender === "male").length;
  const female = children.filter((child) => child.gender === "female").length;
  const total = children.length;

  const ageCounts = new Map<number, number>();
  for (const child of children) {
    const age = Number(child.age);
    if (!Number.isFinite(age)) continue;
    ageCounts.set(age, (ageCounts.get(age) ?? 0) + 1);
  }

  const ageBreakdown = Array.from(ageCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([age, count]) => ({ age, count }));

  return {
    genderBreakdown: {
      male,
      female,
      total,
      malePercentage: toPercentage(male, total),
      femalePercentage: toPercentage(female, total),
    },
    ageBreakdown,
  };
};

export const buildStudentList = (
  children: ChildReportRecord[],
): ReportStudentListItem[] =>
  children.map((child) => ({
    id: String(child._id),
    studentId: child.studentId || "--",
    fullName: `${child.firstName} ${child.lastName}`.trim(),
    gender: child.gender,
    age: Number(child.age || 0),
    status: child.status,
    programType: child.programType,
    schoolYear: child.schoolYear,
    teacherName: formatPersonName(child.teacher),
    centerName: child.daycareCenter?.name || "Unassigned",
    enrollmentDate: child.enrollmentDate
      ? new Date(child.enrollmentDate).toISOString()
      : null,
  }));

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

import { connectDB } from "../src/shared/config/db";
import Attendance from "../src/models/Attendance";
import Child from "../src/models/Child";
import ChildDevelopmentCenter from "../src/models/ChildDevelopmentCenter";
import Feeding from "../src/models/Feeding";
import User from "../src/models/Users";

dotenv.config();

type NameInfo = {
  lastName: string;
  firstName: string;
  middleName?: string;
};

type ParentInfo = NameInfo & {
  email: string;
  phone: string;
  password: string;
};

type TeacherSeed = NameInfo & {
  employeeId: string;
  email: string;
  phone: string;
  password: string;
  daycareCenterCode?: string;
};

type ChildSeed = {
  studentId: string;
  childInfo: NameInfo;
  parentInfo: ParentInfo;
  gender: "male" | "female";
  dateOfBirth: string;
  programType: "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)";
  enrollmentDate: string;
  schoolYear: string;
  status?: "Active" | "Inactive";
  teacherEmployeeId: string;
  daycareCenterCode?: string;
};

type AttendanceRecordSeed = {
  studentId: string;
  status: "present" | "absent";
  childInfo: NameInfo;
  parentInfo: NameInfo;
};

type FeedingRecordSeed = {
  studentId: string;
  status: "completed" | "missed";
  childInfo: NameInfo;
  parentInfo: NameInfo;
};

type AttendanceDocSeed = {
  date: string;
  teacherEmployeeId: string;
  records: AttendanceRecordSeed[];
};

type FeedingDocSeed = {
  date: string;
  teacherEmployeeId: string;
  foodServed: string;
  records: FeedingRecordSeed[];
};

type GeneratedMockDataConfig = {
  enabled?: boolean;
  extraChildrenPerTeacher: number;
  schoolDays: number;
  startDate: string;
  baseStudentId: number;
};

type CenterSeed = {
  code: string;
  barangay: string;
  name: string;
  isActive?: boolean;
};

type MockData = {
  teachers: TeacherSeed[];
  children: ChildSeed[];
  attendanceRecords: AttendanceDocSeed[];
  feedingRecords: FeedingDocSeed[];
  generatedMockData?: GeneratedMockDataConfig;
};

const CHILD_LAST_NAMES = [
  "Dela Cruz",
  "Santos",
  "Reyes",
  "Mendoza",
  "Villanueva",
  "Pascual",
  "Bautista",
  "Ramos",
  "Navarro",
  "Soriano",
  "Mercado",
  "Manalo",
  "Aquino",
  "Tolentino",
  "Castillo",
  "Macaraeg",
  "Francisco",
  "Mallari",
  "Peralta",
  "Cudal",
  "Espejo",
  "Labrador",
];

const CHILD_FIRST_NAMES_MALE = [
  "John Mark",
  "Mark Anthony",
  "Jomari",
  "Renz",
  "Carl John",
  "Paolo",
  "Joshua",
  "Aljon",
  "Jericho",
  "Nathaniel",
  "Prince Carl",
  "Jhay-ar",
];

const CHILD_FIRST_NAMES_FEMALE = [
  "Mary Grace",
  "Angel Mae",
  "Jessa Mae",
  "Anne Rose",
  "Princess Joy",
  "Maricel",
  "Lovely",
  "Janine",
  "Christine Joy",
  "Rose Ann",
  "Mikaela",
  "Shane",
];

const MIDDLE_NAMES = [
  "Dela Cruz",
  "Santos",
  "Reyes",
  "Bautista",
  "Mendoza",
  "Lopez",
  "Garcia",
  "Torres",
  "Rivera",
  "Diaz",
];

const PARENT_FIRST_NAMES = [
  "Marites",
  "Rowena",
  "Rosalie",
  "Evelyn",
  "Liza",
  "Arlene",
  "Noemi",
  "Ronalyn",
  "Gemma",
  "Marilyn",
  "Carmela",
  "Juliet",
  "Fe",
  "Nida",
  "Joel",
  "Rodel",
  "Jun",
  "Ramon",
  "Elmer",
  "Ricky",
];

const FOOD_ROTATION = [
  "Chicken Tinola",
  "Pork Adobo",
  "Beef Caldereta",
  "Ginisang Monggo",
  "Arroz Caldo",
  "Chicken Afritada",
  "Vegetable Soup",
  "Fish Fillet",
  "Lugaw with Egg",
  "Chicken Curry",
];

const readJsonFile = <T>(fileName: string): T => {
  const filePath = path.join(__dirname, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
};

const parseSeedDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const formatSeedDate = (value: Date) => value.toISOString().slice(0, 10);

const normalize = (value?: string) => String(value || "").trim().toLowerCase();

const slugify = (value: string) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

const isMockEmail = (email?: string) =>
  normalize(email).endsWith("@smartkidcare.mock");

const matchesNameInfo = (left: NameInfo, right: NameInfo) =>
  normalize(left.lastName) === normalize(right.lastName) &&
  normalize(left.firstName) === normalize(right.firstName) &&
  normalize(left.middleName) === normalize(right.middleName);

const calculateAgeOnDate = (dateOfBirth: Date, referenceDate: Date) => {
  let age = referenceDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - dateOfBirth.getUTCMonth();
  const dayDiff = referenceDate.getUTCDate() - dateOfBirth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

const ensureUserRole = (
  existingUser: { role?: string; email?: string } | null,
  expectedRole: "teacher" | "parent",
  identifier: string,
) => {
  if (existingUser && existingUser.role !== expectedRole) {
    throw new Error(
      `Cannot seed ${expectedRole} for ${identifier} because the email already belongs to a ${existingUser.role} account.`,
    );
  }
};

const buildCenterTeacherSeeds = (
  baseTeachers: TeacherSeed[],
  centers: CenterSeed[],
  excludedCenterCodes: Set<string> = new Set(),
) => {
  const assignedCenterCodes = new Set<string>([
    ...(
      baseTeachers
        .map((teacher) => teacher.daycareCenterCode)
        .filter(Boolean) as string[]
    ),
    ...Array.from(excludedCenterCodes).filter(Boolean),
  ]);
  const existingNumericIds = baseTeachers
    .map((teacher) =>
      Number(String(teacher.employeeId || "").replace(/[^0-9]/g, "")),
    )
    .filter((value) => Number.isFinite(value) && value > 0);
  let nextNumericId = existingNumericIds.length
    ? Math.max(...existingNumericIds) + 1
    : 1;

  const generatedTeachers = centers
    .filter((center) => center?.code && !assignedCenterCodes.has(center.code))
    .sort((left, right) => left.barangay.localeCompare(right.barangay))
    .map((center, index) => {
      const phoneSuffix = String(2_000_000 + index).slice(-7);

      return {
        employeeId: `CDW-${String(nextNumericId++).padStart(4, "0")}`,
        lastName:
          CHILD_LAST_NAMES[(index + 7) % CHILD_LAST_NAMES.length] ||
          "Fernandez",
        firstName:
          PARENT_FIRST_NAMES[index % PARENT_FIRST_NAMES.length] || "Maria",
        middleName: MIDDLE_NAMES[(index + 3) % MIDDLE_NAMES.length] || "Lopez",
        email: `${slugify(`${center.code}.cdw`)}@smartkidcare.mock`,
        phone: `0917${phoneSuffix}`,
        password: "Teacher123!",
        daycareCenterCode: center.code,
      };
    });

  return [...baseTeachers, ...generatedTeachers];
};

const buildExistingTeacherCoverageSeeds = (
  teachers: any[],
  centerCodeById: Map<string, string>,
  reservedCenterCodes: Set<string> = new Set(),
): TeacherSeed[] =>
  teachers
    .map((teacher: any, index: number) => {
      const centerCode = centerCodeById.get(String(teacher.daycareCenter || ""));
      if (!centerCode || reservedCenterCodes.has(centerCode)) {
        return null;
      }

      return {
        employeeId: `EX-${centerCode}`,
        lastName: String(teacher.lastName || "Teacher"),
        firstName: String(teacher.firstName || "Existing"),
        middleName: String(teacher.middleName || ""),
        email:
          String(teacher.email || "").trim() ||
          `${slugify(`${centerCode}.existing.${index + 1}`)}@smartkidcare.mock`,
        phone:
          String(teacher.phone || "").trim() ||
          `0999${String(8_100_000 + index).slice(-7)}`,
        password: "Teacher123!",
        daycareCenterCode: centerCode,
      };
    })
    .filter(Boolean) as TeacherSeed[];

const buildSchoolDates = (startDate: string, schoolDays: number) => {
  const start = parseSeedDate(startDate);
  const current = new Date(start);
  const dates: string[] = [];

  while (dates.length < schoolDays) {
    const dayOfWeek = current.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(formatSeedDate(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

const buildGeneratedChildren = (
  teachers: TeacherSeed[],
  config?: GeneratedMockDataConfig,
) => {
  if (!config?.enabled) return [];

  const generated: ChildSeed[] = [];
  let studentCounter = config.baseStudentId;
  let parentCounter = 1_000_000;

  teachers.forEach((teacher, teacherIndex) => {
    for (let index = 0; index < config.extraChildrenPerTeacher; index += 1) {
      const baseIndex =
        teacherIndex * config.extraChildrenPerTeacher + index;
      const gender = baseIndex % 2 === 0 ? "male" : "female";
      const lastName =
        CHILD_LAST_NAMES[baseIndex % CHILD_LAST_NAMES.length] || "Dela Cruz";
      const childFirstName =
        gender === "male"
          ? CHILD_FIRST_NAMES_MALE[baseIndex % CHILD_FIRST_NAMES_MALE.length]
          : CHILD_FIRST_NAMES_FEMALE[baseIndex % CHILD_FIRST_NAMES_FEMALE.length];
      const childMiddleName =
        MIDDLE_NAMES[(baseIndex + 2) % MIDDLE_NAMES.length] || "Lopez";
      const parentFirstName =
        PARENT_FIRST_NAMES[baseIndex % PARENT_FIRST_NAMES.length] || "Maria";
      const parentMiddleName =
        MIDDLE_NAMES[(baseIndex + 5) % MIDDLE_NAMES.length] || "Cruz";
      const birthYear = [2020, 2021, 2021, 2022][baseIndex % 4] || 2021;
      const birthMonth = (baseIndex * 3) % 12;
      const birthDay = 5 + (baseIndex % 20);
      const parentToken = String(parentCounter);
      const studentId = `CDC-2026-${studentCounter}`;

      generated.push({
        studentId,
        childInfo: {
          lastName,
          firstName: childFirstName,
          middleName: childMiddleName,
        },
        parentInfo: {
          lastName,
          firstName: parentFirstName,
          middleName: parentMiddleName,
          email: `${slugify(`${parentFirstName}.${lastName}.${parentToken}`)}@smartkidcare.mock`,
          phone: `0918${parentToken}`,
          password: "Parent123!",
        },
        gender,
        dateOfBirth: formatSeedDate(
          new Date(Date.UTC(birthYear, birthMonth, birthDay)),
        ),
        programType:
          baseIndex % 2 === 0
            ? "4Ps Beneficiary"
            : "Regular Enrollee (Non-beneficiary)",
        enrollmentDate: "2026-03-20",
        schoolYear: "2026-2027",
        status: "Active",
        teacherEmployeeId: teacher.employeeId,
        daycareCenterCode: teacher.daycareCenterCode,
      });

      studentCounter += 1;
      parentCounter += 1;
    }
  });

  return generated;
};

const buildGeneratedAttendanceRecords = (
  teachers: TeacherSeed[],
  children: ChildSeed[],
  config?: GeneratedMockDataConfig,
): AttendanceDocSeed[] => {
  if (!config?.enabled) return [];

  const dateKeys = buildSchoolDates(config.startDate, config.schoolDays);

  return dateKeys.flatMap((date, dateIndex) =>
    teachers.map((teacher, teacherIndex) => {
      const teacherChildren = children.filter(
        (child) => child.teacherEmployeeId === teacher.employeeId,
      );

      return {
        date,
        teacherEmployeeId: teacher.employeeId,
        records: teacherChildren.map((child, childIndex) => ({
          studentId: child.studentId,
          status:
            (dateIndex + childIndex + teacherIndex) % 9 === 0
              ? ("absent" as const)
              : ("present" as const),
          childInfo: child.childInfo,
          parentInfo: {
            lastName: child.parentInfo.lastName,
            firstName: child.parentInfo.firstName,
            middleName: child.parentInfo.middleName,
          },
        })),
      };
    }),
  );
};

const buildGeneratedFeedingRecords = (
  teachers: TeacherSeed[],
  children: ChildSeed[],
  config?: GeneratedMockDataConfig,
): FeedingDocSeed[] => {
  if (!config?.enabled) return [];

  const dateKeys = buildSchoolDates(config.startDate, config.schoolDays);

  return dateKeys.flatMap((date, dateIndex) =>
    teachers.map((teacher, teacherIndex) => {
      const teacherChildren = children.filter(
        (child) => child.teacherEmployeeId === teacher.employeeId,
      );

      return {
        date,
        teacherEmployeeId: teacher.employeeId,
        foodServed: FOOD_ROTATION[dateIndex % FOOD_ROTATION.length] || "Arroz Caldo",
        records: teacherChildren.map((child, childIndex) => ({
          studentId: child.studentId,
          status:
            (dateIndex + childIndex * 2 + teacherIndex) % 11 === 0
              ? ("missed" as const)
              : ("completed" as const),
          childInfo: child.childInfo,
          parentInfo: {
            lastName: child.parentInfo.lastName,
            firstName: child.parentInfo.firstName,
            middleName: child.parentInfo.middleName,
          },
        })),
      };
    }),
  );
};

const mergeAttendanceDocs = (
  primary: AttendanceDocSeed[],
  overrides: AttendanceDocSeed[],
) => {
  const docMap = new Map<string, AttendanceDocSeed>();

  primary.forEach((doc) => {
    docMap.set(`${doc.teacherEmployeeId}|${doc.date}`, {
      ...doc,
      records: [...doc.records],
    });
  });

  overrides.forEach((doc) => {
    const key = `${doc.teacherEmployeeId}|${doc.date}`;
    const existing = docMap.get(key);

    if (!existing) {
      docMap.set(key, { ...doc, records: [...doc.records] });
      return;
    }

    const recordMap = new Map<string, AttendanceRecordSeed>();
    existing.records.forEach((record) =>
      recordMap.set(record.studentId, record),
    );
    doc.records.forEach((record) => recordMap.set(record.studentId, record));

    existing.records = Array.from(recordMap.values());
    docMap.set(key, existing);
  });

  return Array.from(docMap.values()).sort((left, right) =>
    `${left.date}-${left.teacherEmployeeId}`.localeCompare(
      `${right.date}-${right.teacherEmployeeId}`,
    ),
  );
};

const mergeFeedingDocs = (
  primary: FeedingDocSeed[],
  overrides: FeedingDocSeed[],
) => {
  const docMap = new Map<string, FeedingDocSeed>();

  primary.forEach((doc) => {
    docMap.set(`${doc.teacherEmployeeId}|${doc.date}`, {
      ...doc,
      records: [...doc.records],
    });
  });

  overrides.forEach((doc) => {
    const key = `${doc.teacherEmployeeId}|${doc.date}`;
    const existing = docMap.get(key);

    if (!existing) {
      docMap.set(key, { ...doc, records: [...doc.records] });
      return;
    }

    const recordMap = new Map<string, FeedingRecordSeed>();
    existing.records.forEach((record) => recordMap.set(record.studentId, record));
    doc.records.forEach((record) => recordMap.set(record.studentId, record));

    existing.foodServed = doc.foodServed || existing.foodServed;
    existing.records = Array.from(recordMap.values());
    docMap.set(key, existing);
  });

  return Array.from(docMap.values()).sort((left, right) =>
    `${left.date}-${left.teacherEmployeeId}`.localeCompare(
      `${right.date}-${right.teacherEmployeeId}`,
    ),
  );
};

async function seed() {
  const payload = readJsonFile<MockData>("recordsMockData.json");

  await connectDB();

  const centerDocs = await ChildDevelopmentCenter.find({
    isActive: { $ne: false },
  }).select("_id code barangay name isActive");
  const centerMap = new Map<string, mongoose.Types.ObjectId>(
    centerDocs.map((center: any) => [String(center.code), center._id]),
  );
  const centerCodeById = new Map<string, string>(
    centerDocs.map((center: any) => [String(center._id), String(center.code || "")]),
  );
  const activeCenters: CenterSeed[] = centerDocs.map((center: any) => ({
    code: String(center.code || ""),
    barangay: String(center.barangay || ""),
    name: String(center.name || ""),
    isActive: center.isActive !== false,
  }));
  const payloadCenterCodes = new Set(
    payload.teachers
      .map((teacher) => teacher.daycareCenterCode)
      .filter(Boolean) as string[],
  );
  const existingAssignedTeachers = await User.find({
    role: "teacher",
    isActive: true,
    daycareCenter: { $ne: null },
  }).select("employeeId firstName middleName lastName email phone daycareCenter");
  const existingTeacherCoverageSeeds = buildExistingTeacherCoverageSeeds(
    existingAssignedTeachers as any[],
    centerCodeById,
    payloadCenterCodes,
  );
  const teacherSeeds = buildCenterTeacherSeeds(
    payload.teachers,
    activeCenters,
    new Set(
      existingTeacherCoverageSeeds
        .map((teacher) => teacher.daycareCenterCode)
        .filter(Boolean) as string[],
    ),
  );
  const coverageTeacherSeeds = [
    ...teacherSeeds,
    ...existingTeacherCoverageSeeds.filter(
      (teacher) =>
        !teacherSeeds.some(
          (candidate) =>
            candidate.daycareCenterCode &&
            candidate.daycareCenterCode === teacher.daycareCenterCode,
        ),
    ),
  ];
  const generatedChildren = buildGeneratedChildren(
    coverageTeacherSeeds,
    payload.generatedMockData,
  );
  const allChildren = [...payload.children, ...generatedChildren];
  const generatedAttendanceRecords = buildGeneratedAttendanceRecords(
    coverageTeacherSeeds,
    allChildren,
    payload.generatedMockData,
  );
  const generatedFeedingRecords = buildGeneratedFeedingRecords(
    coverageTeacherSeeds,
    allChildren,
    payload.generatedMockData,
  );
  const teacherSeedByEmployeeId = new Map<string, TeacherSeed>(
    coverageTeacherSeeds.map((teacher) => [teacher.employeeId, teacher]),
  );
  const attendanceSeeds = mergeAttendanceDocs(
    generatedAttendanceRecords,
    payload.attendanceRecords,
  );
  const feedingSeeds = mergeFeedingDocs(
    generatedFeedingRecords,
    payload.feedingRecords,
  );
  const allCenterCodes = new Set<string>();
  coverageTeacherSeeds.forEach((teacher) => {
    if (teacher.daycareCenterCode) allCenterCodes.add(teacher.daycareCenterCode);
  });
  allChildren.forEach((child) => {
    if (child.daycareCenterCode) allCenterCodes.add(child.daycareCenterCode);
  });

  for (const centerCode of allCenterCodes) {
    if (!centerMap.has(centerCode)) {
      console.warn(
        `Center code ${centerCode} was not found. Seed the Dagupan centers first if you want center links populated.`,
      );
    }
  }

  const teacherMap = new Map<string, any>();
  for (const teacherSeed of teacherSeeds) {
    const normalizedTeacherEmail = normalize(teacherSeed.email);
    if (!normalizedTeacherEmail) {
      throw new Error(
        `Teacher seed ${teacherSeed.employeeId} is missing a valid email address.`,
      );
    }

    const existingByEmail = await User.findOne({ email: normalizedTeacherEmail });
    ensureUserRole(existingByEmail, "teacher", normalizedTeacherEmail);
    const existingByEmployeeId = await User.findOne({
      employeeId: teacherSeed.employeeId,
    });

    const hashedPassword = await bcrypt.hash(teacherSeed.password, 10);
    const daycareCenter =
      (teacherSeed.daycareCenterCode &&
        centerMap.get(teacherSeed.daycareCenterCode)) ||
      null;

    let teacher = existingByEmail || existingByEmployeeId;

    if (
      existingByEmail &&
      existingByEmployeeId &&
      String(existingByEmail._id) !== String(existingByEmployeeId._id)
    ) {
      const emailOwnerIsMock = isMockEmail(existingByEmail.email);
      const employeeOwnerIsMock = isMockEmail(existingByEmployeeId.email);

      if (!emailOwnerIsMock && !employeeOwnerIsMock) {
        throw new Error(
          `Conflicting teacher records for ${normalizedTeacherEmail} and ${teacherSeed.employeeId}. Resolve manually before seeding.`,
        );
      }

      // Prefer the email owner account and retire only mock duplicate employee-ID records.
      teacher = existingByEmail;
      if (employeeOwnerIsMock) {
        existingByEmployeeId.isActive = false;
        existingByEmployeeId.employeeId = undefined;
        await existingByEmployeeId.save();
      }
    }

    if (!teacher) {
      teacher = new User({
        employeeId: teacherSeed.employeeId,
        firstName: teacherSeed.firstName,
        middleName: teacherSeed.middleName || "",
        lastName: teacherSeed.lastName,
        email: normalizedTeacherEmail,
        phone: teacherSeed.phone,
        password: hashedPassword,
        role: "teacher",
        isActive: true,
        mustChangePassword: false,
        daycareCenter,
      });
    } else {
      teacher.employeeId = teacherSeed.employeeId;
      teacher.firstName = teacherSeed.firstName;
      teacher.middleName = teacherSeed.middleName || "";
      teacher.lastName = teacherSeed.lastName;
      teacher.email = normalizedTeacherEmail;
      teacher.phone = teacherSeed.phone;
      teacher.password = hashedPassword;
      teacher.role = "teacher";
      teacher.isActive = true;
      teacher.mustChangePassword = false;
      teacher.daycareCenter = daycareCenter;
    }

    await teacher.save();
    teacherMap.set(teacherSeed.employeeId, teacher);
  }

  const activeTeacherDocs = await User.find({
    role: "teacher",
    isActive: true,
    daycareCenter: { $ne: null },
  }).select("_id employeeId email firstName middleName lastName daycareCenter");
  const primaryTeacherByCenterCode = new Map<string, any>();
  const duplicateMockTeacherIds: string[] = [];
  const teachersByCenterCode = new Map<string, any[]>();

  activeTeacherDocs.forEach((teacher: any) => {
    const centerId = String(teacher.daycareCenter || "");
    const centerCode =
      Array.from(centerMap.entries()).find(
        ([, value]) => String(value) === centerId,
      )?.[0] || "";
    if (!centerCode) return;
    const group = teachersByCenterCode.get(centerCode) || [];
    group.push(teacher);
    teachersByCenterCode.set(centerCode, group);
  });

  teachersByCenterCode.forEach((teachers, centerCode) => {
    const sorted = [...teachers].sort((left: any, right: any) => {
      const leftIsMock = isMockEmail(left.email);
      const rightIsMock = isMockEmail(right.email);
      if (leftIsMock !== rightIsMock) return leftIsMock ? 1 : -1;
      return String(left.employeeId || "").localeCompare(
        String(right.employeeId || ""),
      );
    });
    const primary = sorted[0];
    primaryTeacherByCenterCode.set(centerCode, primary);

    sorted.slice(1).forEach((teacher: any) => {
      if (isMockEmail(teacher.email)) {
        duplicateMockTeacherIds.push(String(teacher._id));
      }
    });
  });

  const parentMap = new Map<string, any>();
  for (const childSeed of allChildren) {
    const normalizedParentEmail = normalize(childSeed.parentInfo.email);
    if (!normalizedParentEmail) {
      throw new Error(
        `Child seed ${childSeed.studentId} is missing a valid parent email.`,
      );
    }
    if (parentMap.has(normalizedParentEmail)) continue;

    const existingByEmail = await User.findOne({
      email: normalizedParentEmail,
    });
    ensureUserRole(existingByEmail, "parent", normalizedParentEmail);

    const hashedPassword = await bcrypt.hash(childSeed.parentInfo.password, 10);
    let parent = await User.findOne({ email: normalizedParentEmail });

    if (!parent) {
      parent = new User({
        firstName: childSeed.parentInfo.firstName,
        middleName: childSeed.parentInfo.middleName || "",
        lastName: childSeed.parentInfo.lastName,
        email: normalizedParentEmail,
        phone: childSeed.parentInfo.phone,
        password: hashedPassword,
        role: "parent",
        isActive: true,
        mustChangePassword: false,
        needsToConfirmLink: false,
      });
    } else {
      parent.firstName = childSeed.parentInfo.firstName;
      parent.middleName = childSeed.parentInfo.middleName || "";
      parent.lastName = childSeed.parentInfo.lastName;
      parent.email = normalizedParentEmail;
      parent.phone = childSeed.parentInfo.phone;
      parent.password = hashedPassword;
      parent.role = "parent";
      parent.isActive = true;
      parent.mustChangePassword = false;
      parent.needsToConfirmLink = false;
    }

    await parent.save();
    parentMap.set(normalizedParentEmail, parent);
  }

  const childSeedMap = new Map<string, ChildSeed>(
    allChildren.map((child) => [child.studentId, child]),
  );
  const childDocMap = new Map<string, any>();

  for (const childSeed of allChildren) {
    const parent = parentMap.get(normalize(childSeed.parentInfo.email));
    const teacher =
      teacherMap.get(childSeed.teacherEmployeeId) ||
      (childSeed.daycareCenterCode &&
        primaryTeacherByCenterCode.get(childSeed.daycareCenterCode));

    if (!parent?._id) {
      throw new Error(`Missing parent account for ${childSeed.studentId}`);
    }

    if (!teacher?._id) {
      throw new Error(
        `Missing teacher account for ${childSeed.studentId}: ${childSeed.teacherEmployeeId}`,
      );
    }

    const dateOfBirth = parseSeedDate(childSeed.dateOfBirth);
    const enrollmentDate = parseSeedDate(childSeed.enrollmentDate);
    const age = calculateAgeOnDate(dateOfBirth, enrollmentDate);
    // Keep child center aligned with the assigned teacher's center.
    const daycareCenter =
      teacher.daycareCenter ||
      (childSeed.daycareCenterCode && centerMap.get(childSeed.daycareCenterCode)) ||
      null;

    const child = await Child.findOneAndUpdate(
      { studentId: childSeed.studentId },
      {
        $set: {
          studentId: childSeed.studentId,
          firstName: childSeed.childInfo.firstName,
          middleName: childSeed.childInfo.middleName || "",
          lastName: childSeed.childInfo.lastName,
          dateOfBirth,
          age,
          gender: childSeed.gender,
          programType: childSeed.programType,
          enrollmentDate,
          schoolYear: childSeed.schoolYear,
          status: childSeed.status || "Active",
          parent: parent._id,
          teacher: teacher._id,
          daycareCenter,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    childDocMap.set(childSeed.studentId, child);
  }

  const validateRecordLinks = (
    studentId: string,
    childInfo: NameInfo,
    parentInfo: NameInfo,
  ) => {
    const source = childSeedMap.get(studentId);
    if (!source) {
      throw new Error(`Student ${studentId} was not found in the children mock data.`);
    }

    if (!matchesNameInfo(source.childInfo, childInfo)) {
      throw new Error(`Child name mismatch found in mock records for ${studentId}.`);
    }

    if (!matchesNameInfo(source.parentInfo, parentInfo)) {
      throw new Error(`Parent name mismatch found in mock records for ${studentId}.`);
    }
  };

  for (const attendanceSeed of attendanceSeeds) {
    const attendanceTeacherSeed = teacherSeedByEmployeeId.get(
      attendanceSeed.teacherEmployeeId,
    );
    const teacher =
      teacherMap.get(attendanceSeed.teacherEmployeeId) ||
      (attendanceTeacherSeed?.daycareCenterCode &&
        primaryTeacherByCenterCode.get(attendanceTeacherSeed.daycareCenterCode));
    if (!teacher?._id) {
      throw new Error(
        `Attendance teacher ${attendanceSeed.teacherEmployeeId} was not found.`,
      );
    }

    const records = attendanceSeed.records.map((record) => {
      validateRecordLinks(record.studentId, record.childInfo, record.parentInfo);

      const child = childDocMap.get(record.studentId);
      if (!child?._id) {
        throw new Error(`Attendance child ${record.studentId} was not found.`);
      }

      return {
        child: child._id,
        status: record.status,
      };
    });

    await Attendance.findOneAndUpdate(
      {
        date: parseSeedDate(attendanceSeed.date),
        teacher: teacher._id,
      },
      {
        $set: {
          date: parseSeedDate(attendanceSeed.date),
          teacher: teacher._id,
          records,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  for (const feedingSeed of feedingSeeds) {
    const feedingTeacherSeed = teacherSeedByEmployeeId.get(
      feedingSeed.teacherEmployeeId,
    );
    const teacher =
      teacherMap.get(feedingSeed.teacherEmployeeId) ||
      (feedingTeacherSeed?.daycareCenterCode &&
        primaryTeacherByCenterCode.get(feedingTeacherSeed.daycareCenterCode));
    if (!teacher?._id) {
      throw new Error(
        `Feeding teacher ${feedingSeed.teacherEmployeeId} was not found.`,
      );
    }

    const records = feedingSeed.records.map((record) => {
      validateRecordLinks(record.studentId, record.childInfo, record.parentInfo);

      const child = childDocMap.get(record.studentId);
      if (!child?._id) {
        throw new Error(`Feeding child ${record.studentId} was not found.`);
      }

      return {
        child: child._id,
        status: record.status,
      };
    });

    await Feeding.findOneAndUpdate(
      {
        date: parseSeedDate(feedingSeed.date),
        teacher: teacher._id,
      },
      {
        $set: {
          date: parseSeedDate(feedingSeed.date),
          teacher: teacher._id,
          foodServed: feedingSeed.foodServed,
          records,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  if (duplicateMockTeacherIds.length > 0) {
    await User.updateMany(
      { _id: { $in: duplicateMockTeacherIds } },
      { $set: { isActive: false } },
    );
  }

  console.log(`Seeded ${teacherSeeds.length} mock child development worker(s).`);
  console.log(
    `Covered ${coverageTeacherSeeds.length} center teacher assignment(s), including existing center teachers.`,
  );
  console.log(`Seeded ${allChildren.length} enrolled child record(s).`);
  console.log(
    `Seeded ${attendanceSeeds.length} attendance day record(s) and ${feedingSeeds.length} feeding day record(s).`,
  );

  if (generatedChildren.length > 0) {
    console.log(
      `Generated ${generatedChildren.length} extra mock child record(s) from JSON settings.`,
    );
  }

  if (duplicateMockTeacherIds.length > 0) {
    console.log(
      `Deactivated ${duplicateMockTeacherIds.length} duplicate mock teacher account(s) so each center keeps one active worker.`,
    );
  }
}

seed()
  .catch((error) => {
    console.error("Failed to seed records mock data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

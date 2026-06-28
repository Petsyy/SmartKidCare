import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../src/shared/config/db";
import Child from "../src/models/Child";
import User from "../src/models/Users";

dotenv.config();

type ProgramType =
  | "4Ps Beneficiary"
  | "Regular Enrollee (Non-beneficiary)"
  | "Uncategorized (Legacy)";
type ConflictMode = "prefer-breakdown" | "prefer-total";

type ScriptConfig = {
  targetTotal?: number;
  targetFourPs?: number;
  targetRegular?: number;
  targetUncategorized?: number;
  mode: ConflictMode;
  dryRun: boolean;
};

const MALE_NAMES = [
  "John Mark",
  "Paolo",
  "Nathan",
  "Jericho",
  "Carlo",
  "Joshua",
  "Prince",
  "Renz",
];

const FEMALE_NAMES = [
  "Mary Grace",
  "Jessa",
  "Angel",
  "Christine",
  "Janine",
  "Lovely",
  "Mikaela",
  "Rose Ann",
];

const LAST_NAMES = [
  "Dela Cruz",
  "Reyes",
  "Santos",
  "Mendoza",
  "Bautista",
  "Ramos",
  "Navarro",
  "Francisco",
];

const MIDDLE_NAMES = [
  "Santos",
  "Reyes",
  "Mendoza",
  "Lopez",
  "Garcia",
  "Torres",
  "Rivera",
  "Diaz",
];

const parseIntegerArg = (raw?: string): number | undefined => {
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  const value = Math.floor(parsed);
  return value >= 0 ? value : undefined;
};

const parseArgs = (): ScriptConfig => {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const token = String(args[index] || "").trim();
    if (!token.startsWith("--")) continue;

    const next = String(args[index + 1] || "").trim();
    if (next && !next.startsWith("--")) {
      map.set(token, next);
      index += 1;
    } else {
      map.set(token, "true");
    }
  }

  const modeValue = String(
    map.get("--mode") || map.get("--conflict-mode") || "prefer-breakdown",
  ).toLowerCase();

  const mode: ConflictMode =
    modeValue === "prefer-total" ? "prefer-total" : "prefer-breakdown";

  return {
    targetTotal:
      parseIntegerArg(map.get("--target-total")) ??
      parseIntegerArg(map.get("--total")),
    targetFourPs:
      parseIntegerArg(map.get("--target-4ps")) ??
      parseIntegerArg(map.get("--four-ps")) ??
      parseIntegerArg(map.get("--fourps")),
    targetRegular:
      parseIntegerArg(map.get("--target-regular")) ??
      parseIntegerArg(map.get("--regular")),
    targetUncategorized:
      parseIntegerArg(map.get("--target-uncategorized")) ??
      parseIntegerArg(map.get("--uncategorized")),
    mode,
    dryRun: map.get("--dry-run") === "true",
  };
};

const getManilaNow = () => {
  const now = new Date();
  const manila = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Manila" }),
  );
  return manila;
};

const formatDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createDateOfBirth = (seed: number): Date => {
  const year = 2020 + (seed % 3); // 2020..2022
  const month = seed % 12;
  const day = 1 + (seed % 28);
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};

const calculateAgeOnDate = (dateOfBirth: Date, referenceDate: Date): number => {
  let age = referenceDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - dateOfBirth.getUTCMonth();
  const dayDiff = referenceDate.getUTCDate() - dateOfBirth.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
};

const nextStudentSeed = (existingStudentIds: string[]): number => {
  const values = existingStudentIds
    .map((studentId) => {
      const match = /CDC-\d{4}-(\d+)/.exec(String(studentId || ""));
      return match ? Number(match[1]) : Number.NaN;
    })
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return 600001;
  return Math.max(...values) + 1;
};

const createSchoolYear = (enrollmentDate: Date) => {
  const year = enrollmentDate.getUTCFullYear();
  return `${year}-${year + 1}`;
};

const resolveTargets = (
  config: ScriptConfig,
): {
  targetFourPs: number;
  targetRegular: number;
  targetUncategorized: number;
  targetTotal: number;
  warnings: string[];
} => {
  const warnings: string[] = [];

  let targetFourPs = config.targetFourPs ?? 70;
  let targetRegular = config.targetRegular ?? 692;
  let targetTotal = config.targetTotal ?? 810;
  let targetUncategorized = config.targetUncategorized ?? 0;

  if (targetFourPs < 0) targetFourPs = 0;
  if (targetRegular < 0) targetRegular = 0;
  if (targetTotal < 0) targetTotal = 0;
  if (targetUncategorized < 0) targetUncategorized = 0;

  const breakdownTotal = targetFourPs + targetRegular + targetUncategorized;
  if (targetTotal !== breakdownTotal) {
    if (config.targetUncategorized === undefined && targetTotal > breakdownTotal) {
      targetUncategorized = targetTotal - targetFourPs - targetRegular;
      warnings.push(
        `Target mismatch: total=${targetTotal} but 4Ps+Regular=${targetFourPs + targetRegular}. Auto-filling uncategorized to ${targetUncategorized}.`,
      );
    } else {
      if (config.mode === "prefer-total") {
        const adjustedRegular = Math.max(
          0,
          targetTotal - targetFourPs - targetUncategorized,
        );
        warnings.push(
          `Target mismatch: total=${targetTotal} but 4Ps+Regular+Uncategorized=${breakdownTotal}. Using prefer-total and adjusting regular to ${adjustedRegular}.`,
        );
        targetRegular = adjustedRegular;
      } else {
        const adjustedTotal = targetFourPs + targetRegular + targetUncategorized;
        warnings.push(
          `Target mismatch: total=${targetTotal} but 4Ps+Regular+Uncategorized=${breakdownTotal}. Using prefer-breakdown and setting total to ${adjustedTotal}.`,
        );
        targetTotal = adjustedTotal;
      }
    }
  }

  return {
    targetFourPs,
    targetRegular,
    targetUncategorized,
    targetTotal,
    warnings,
  };
};

async function run() {
  const config = parseArgs();
  const targets = resolveTargets(config);

  await connectDB();

  const teachers = await User.find({
    role: "teacher",
    isActive: true,
    daycareCenter: { $ne: null },
  })
    .select("_id daycareCenter firstName lastName")
    .lean();

  if (!teachers.length) {
    throw new Error(
      "No active teachers with assigned daycare centers found. Seed teachers/centers first.",
    );
  }

  const [currentTotal, currentFourPs, currentRegular] = await Promise.all([
    Child.countDocuments(),
    Child.countDocuments({ programType: "4Ps Beneficiary" }),
    Child.countDocuments({
      programType: "Regular Enrollee (Non-beneficiary)",
    }),
  ]);
  const currentUncategorized = Math.max(
    0,
    currentTotal - currentFourPs - currentRegular,
  );

  const addFourPs = Math.max(0, targets.targetFourPs - currentFourPs);
  const addRegular = Math.max(0, targets.targetRegular - currentRegular);
  const addUncategorized = Math.max(
    0,
    targets.targetUncategorized - currentUncategorized,
  );

  const warnings = [...targets.warnings];
  if (currentFourPs > targets.targetFourPs) {
    warnings.push(
      `Current 4Ps count (${currentFourPs}) is already above target (${targets.targetFourPs}); no 4Ps children were removed.`,
    );
  }
  if (currentRegular > targets.targetRegular) {
    warnings.push(
      `Current regular count (${currentRegular}) is already above target (${targets.targetRegular}); no regular children were removed.`,
    );
  }
  if (currentUncategorized > targets.targetUncategorized) {
    warnings.push(
      `Current uncategorized count (${currentUncategorized}) is already above target (${targets.targetUncategorized}); no uncategorized children were removed.`,
    );
  }

  const existingStudentIds = await Child.find()
    .select("studentId")
    .lean()
    .then((rows: any[]) =>
      rows.map((row) => String(row.studentId || "")).filter(Boolean),
    );
  const existingIdSet = new Set(existingStudentIds);
  let nextStudentNumber = nextStudentSeed(existingStudentIds);

  const manilaNow = getManilaNow();
  const enrollmentDate = new Date(
    Date.UTC(
      manilaNow.getFullYear(),
      manilaNow.getMonth(),
      manilaNow.getDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const schoolYear = createSchoolYear(enrollmentDate);

  const createChildren = (
    count: number,
    programType: ProgramType,
    startingSeed: number,
  ) => {
    const docs: any[] = [];
    for (let i = 0; i < count; i += 1) {
      const seed = startingSeed + i;
      const isFemale = seed % 2 === 1;
      const firstName = isFemale
        ? FEMALE_NAMES[seed % FEMALE_NAMES.length]
        : MALE_NAMES[seed % MALE_NAMES.length];
      const middleName = MIDDLE_NAMES[seed % MIDDLE_NAMES.length];
      const lastName = LAST_NAMES[seed % LAST_NAMES.length];
      const teacher = teachers[seed % teachers.length];
      const dateOfBirth = createDateOfBirth(seed);
      const age = calculateAgeOnDate(dateOfBirth, enrollmentDate);

      let studentId = `CDC-${manilaNow.getFullYear()}-${String(nextStudentNumber).padStart(6, "0")}`;
      while (existingIdSet.has(studentId)) {
        nextStudentNumber += 1;
        studentId = `CDC-${manilaNow.getFullYear()}-${String(nextStudentNumber).padStart(6, "0")}`;
      }
      existingIdSet.add(studentId);
      nextStudentNumber += 1;

      docs.push({
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        age: Math.max(3, age),
        gender: isFemale ? "female" : "male",
        programType,
        enrollmentDate,
        schoolYear,
        status: "Active",
        studentId,
        teacher: teacher._id,
        daycareCenter: (teacher as any).daycareCenter || null,
      });
    }
    return docs;
  };

  const childrenToAdd = [
    ...createChildren(addFourPs, "4Ps Beneficiary", 1_000),
    ...createChildren(addRegular, "Regular Enrollee (Non-beneficiary)", 5_000),
    ...createChildren(addUncategorized, "Uncategorized (Legacy)", 9_000),
  ];

  const projectedTotal = currentTotal + childrenToAdd.length;
  const projectedFourPs = currentFourPs + addFourPs;
  const projectedRegular = currentRegular + addRegular;
  const projectedUncategorized = currentUncategorized + addUncategorized;

  console.log("Seed children by targets");
  console.log(
    `Current counts: total=${currentTotal}, 4Ps=${currentFourPs}, regular=${currentRegular}, uncategorized=${currentUncategorized}`,
  );
  console.log(
    `Target counts: total=${targets.targetTotal}, 4Ps=${targets.targetFourPs}, regular=${targets.targetRegular}, uncategorized=${targets.targetUncategorized}`,
  );
  console.log(
    `To add now: total=${childrenToAdd.length}, 4Ps=${addFourPs}, regular=${addRegular}, uncategorized=${addUncategorized}`,
  );
  console.log(
    `Projected counts: total=${projectedTotal}, 4Ps=${projectedFourPs}, regular=${projectedRegular}, uncategorized=${projectedUncategorized}`,
  );
  console.log(
    `Enrollment date key (Asia/Manila): ${formatDateKey(manilaNow)}, teachers used=${teachers.length}`,
  );

  warnings.forEach((warning) => console.warn(`[warning] ${warning}`));

  if (config.dryRun) {
    console.log("Dry run enabled. No database writes were made.");
    return;
  }

  if (childrenToAdd.length === 0) {
    console.log("No children needed. Targets are already met or exceeded.");
    return;
  }

  const categorizedChildren = childrenToAdd.filter(
    (child) => child.programType !== "Uncategorized (Legacy)",
  );
  const uncategorizedChildren = childrenToAdd.filter(
    (child) => child.programType === "Uncategorized (Legacy)",
  );

  if (categorizedChildren.length) {
    await Child.insertMany(categorizedChildren);
  }

  if (uncategorizedChildren.length) {
    await Child.collection.insertMany(uncategorizedChildren as any[]);
  }

  console.log(
    `Inserted ${childrenToAdd.length} child record(s): ${categorizedChildren.length} categorized and ${uncategorizedChildren.length} uncategorized.`,
  );
}

run()
  .catch((error) => {
    console.error("Failed to seed children by targets:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

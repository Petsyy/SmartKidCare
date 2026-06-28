import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

import Attendance from "../src/models/Attendance";
import Feeding from "../src/models/Feeding";
import Child from "../src/models/Child";
import User from "../src/models/Users";

type AttendanceSeedRow = {
  studentId: string;
  date: string;
  status: string;
};

type FeedingSeedRow = {
  studentId: string;
  date: string;
  food: string;
  status: string;
};

function readJsonFile<T>(fileName: string): T {
  const filePath = path.join(__dirname, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

const attendanceData = readJsonFile<AttendanceSeedRow[]>("attendance.json");
const feedingData = readJsonFile<FeedingSeedRow[]>("feeding.json");

function toAttendanceStatus(value: string): "present" | "absent" {
  return value.trim().toLowerCase() === "absent" ? "absent" : "present";
}

function toFeedingStatus(value: string): "completed" | "missed" {
  return value.trim().toLowerCase() === "missed" ? "missed" : "completed";
}

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in environment variables.");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const children = await Child.find().select("_id studentId");
  const childMap = new Map<string, mongoose.Types.ObjectId>(
    children.map((child: any) => [String(child.studentId), child._id]),
  );

  const seedTeacherEmail = String(process.env.SEED_TEACHER_EMAIL || "").trim();
  const teacherQuery = seedTeacherEmail
    ? { role: "teacher", email: seedTeacherEmail }
    : { role: "teacher" };
  const teacher = await User.findOne(teacherQuery).select("_id email");
  if (!teacher?._id) {
    throw new Error(
      seedTeacherEmail
        ? `Teacher not found for SEED_TEACHER_EMAIL=${seedTeacherEmail}`
        : "No teacher user found. Create a teacher account first.",
    );
  }

  console.log(`Seeding records for teacher: ${teacher.email || teacher._id}`);

  await Attendance.deleteMany({});
  await Feeding.deleteMany({});

  const attendanceByDate = new Map<
    string,
    Array<{ child: mongoose.Types.ObjectId; status: "present" | "absent" }>
  >();

  for (const row of attendanceData) {
    const childId = childMap.get(String(row.studentId));
    if (!childId) continue;

    const dateKey = String(row.date);
    const records = attendanceByDate.get(dateKey) ?? [];
    records.push({
      child: childId,
      status: toAttendanceStatus(row.status),
    });
    attendanceByDate.set(dateKey, records);
  }

  const attendanceDocs = Array.from(attendanceByDate.entries()).map(
    ([date, records]) => ({
      date: new Date(date),
      teacher: teacher._id,
      records,
    }),
  );

  const feedingByDate = new Map<
    string,
    {
      foodServed: string;
      records: Array<{
        child: mongoose.Types.ObjectId;
        status: "completed" | "missed";
      }>;
    }
  >();

  for (const row of feedingData) {
    const childId = childMap.get(String(row.studentId));
    if (!childId) continue;

    const dateKey = String(row.date);
    const existing = feedingByDate.get(dateKey) ?? {
      foodServed: String(row.food || "").trim(),
      records: [],
    };

    if (!existing.foodServed) {
      existing.foodServed = String(row.food || "").trim();
    }

    existing.records.push({
      child: childId,
      status: toFeedingStatus(row.status),
    });

    feedingByDate.set(dateKey, existing);
  }

  const feedingDocs = Array.from(feedingByDate.entries()).map(
    ([date, payload]) => ({
      date: new Date(date),
      teacher: teacher._id,
      foodServed: payload.foodServed,
      records: payload.records,
    }),
  );

  if (attendanceDocs.length) {
    await Attendance.insertMany(attendanceDocs);
  }

  if (feedingDocs.length) {
    await Feeding.insertMany(feedingDocs);
  }

  console.log(
    `Seeded ${attendanceDocs.length} attendance day(s) and ${feedingDocs.length} feeding day(s).`,
  );

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});

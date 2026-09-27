import { createHash } from "crypto";

type RecordInput = {
  child: unknown;
  status: unknown;
  notes?: unknown;
};

const canonicalRecords = (records: RecordInput[]) =>
  records
    .map((record) => ({
      child: String(record.child),
      status: String(record.status),
      notes: String(record.notes ?? "").trim(),
    }))
    .sort((left, right) => left.child.localeCompare(right.child));

export const hashAttendancePayload = (input: {
  date: string;
  records: RecordInput[];
}) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        date: input.date,
        records: canonicalRecords(input.records),
      }),
    )
    .digest("hex");

export const hashFeedingPayload = (input: {
  date: string;
  foodServed: string;
  records: RecordInput[];
}) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        date: input.date,
        foodServed: input.foodServed.trim(),
        records: canonicalRecords(input.records),
      }),
    )
    .digest("hex");

export const isMongoDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === 11000;

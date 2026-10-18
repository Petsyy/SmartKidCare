import test from "node:test";
import assert from "node:assert/strict";

import { AttendanceService } from "../src/modules/attendance/services/attendance.service";
import { updateAttendanceSchema } from "../src/modules/attendance/validators/attendance.validator";
import { recordServiceSupport } from "../src/shared/services/record-service-support";

const teacher = {
  id: "507f1f77bcf86cd799439011",
  role: "teacher",
  daycareCenterId: "507f1f77bcf86cd799439012",
};
const childA = "507f1f77bcf86cd799439013";
const childB = "507f1f77bcf86cd799439014";

const dependencies = (overrides: Record<string, unknown> = {}) =>
  ({
    support: recordServiceSupport,
    childRepository: {
      findAssignedChildIds: async (ids: string[]) => ids,
      findAllAssignedChildIds: async () => [childA, childB],
    },
    attendanceRepository: {
      findByOperationId: async () => null,
      findByTeacherAndDay: async () => null,
      create: async (value: unknown) => ({ _id: "attendance", ...value as object }),
      findHistory: async () => [],
      findRevisionByOperationId: async () => null,
      findById: async () => null,
      updateWithRevision: async () => null,
    },
    findChildIdsByParent: async () => [],
    findHistory: async () => [],
    notifySubmitted: async () => undefined,
    ...overrides,
  }) as any;

test("attendance validation accepts Excused with a reason", () => {
  const parsed = updateAttendanceSchema.safeParse({
    clientOperationId: "550e8400-e29b-41d4-a716-446655440000",
    expectedVersion: 0,
    records: [
      { child: childA, status: "excused", excuseReason: "sick" },
    ],
  });
  assert.equal(parsed.success, true);
});

test("attendance validation rejects Excused without a reason and Other without notes", () => {
  assert.equal(
    updateAttendanceSchema.safeParse({
      clientOperationId: "550e8400-e29b-41d4-a716-446655440000",
      expectedVersion: 0,
      records: [{ child: childA, status: "excused" }],
    }).success,
    false,
  );
  assert.equal(
    updateAttendanceSchema.safeParse({
      clientOperationId: "550e8400-e29b-41d4-a716-446655440000",
      expectedVersion: 0,
      records: [
        { child: childA, status: "excused", excuseReason: "other" },
      ],
    }).success,
    false,
  );
});

test("final submission rejects an incomplete roster instead of defaulting it to absent", async () => {
  const service = new AttendanceService(dependencies());
  await assert.rejects(
    () =>
      service.submit(teacher, {
        clientOperationId: "550e8400-e29b-41d4-a716-446655440000",
        date: "2026-10-18",
        records: [{ child: childA, status: "present" }],
      }),
    /Mark every assigned child/,
  );
});

test("same-day owner update uses optimistic versioning and records Excused separately", async () => {
  let committed: any;
  const existing = {
    _id: "507f1f77bcf86cd799439099",
    teacher: teacher.id,
    daycareCenter: teacher.daycareCenterId,
    date: new Date(),
    version: 0,
    records: [
      { child: childA, status: "present" },
      { child: childB, status: "absent" },
    ],
  };
  const service = new AttendanceService(
    dependencies({
      attendanceRepository: {
        findRevisionByOperationId: async () => null,
        findById: async () => existing,
        updateWithRevision: async (input: unknown) => {
          committed = input;
          return { ...existing, version: 1, records: (input as any).records };
        },
      },
    }),
  );
  const result = await service.update(
    teacher,
    String(existing._id),
    {
      clientOperationId: "550e8400-e29b-41d4-a716-446655440001",
      expectedVersion: 0,
      records: [
        { child: childA, status: "present" },
        { child: childB, status: "excused", excuseReason: "sick" },
      ],
    },
  );
  assert.equal(result.isUpdate, true);
  assert.equal(committed.changes.length, 1);
  assert.equal(committed.changes[0].afterStatus, "excused");
  assert.equal(committed.expectedVersion, 0);
});

test("past attendance cannot be edited by a teacher", async () => {
  const existing = {
    _id: "507f1f77bcf86cd799439099",
    teacher: teacher.id,
    daycareCenter: teacher.daycareCenterId,
    date: new Date(Date.now() - 86_400_000),
    version: 0,
    records: [
      { child: childA, status: "present" },
      { child: childB, status: "absent" },
    ],
  };
  const service = new AttendanceService(
    dependencies({
      attendanceRepository: {
        findRevisionByOperationId: async () => null,
        findById: async () => existing,
      },
    }),
  );
  await assert.rejects(
    () =>
      service.update(teacher, String(existing._id), {
        clientOperationId: "550e8400-e29b-41d4-a716-446655440002",
        expectedVersion: 0,
        records: [
          { child: childA, status: "absent" },
          { child: childB, status: "absent" },
        ],
      }),
    /same Manila calendar day/,
  );
});

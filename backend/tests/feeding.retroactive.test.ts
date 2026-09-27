import assert from "node:assert/strict";
import test from "node:test";
import { FeedingService } from "../src/modules/feeding/services/feeding.service";
import { RecordServiceSupport } from "../src/shared/services/record-service-support";

const createService = (findByTeacherAndDay: () => Promise<any>) => {
  let createdData: any = null;
  let notifications = 0;

  const service = new FeedingService({
    support: new RecordServiceSupport(),
    childRepository: {
      findAssignedChildIds: async () => ["child-1"],
    } as any,
    feedingRepository: {
      findByOperationId: async () => null,
      findByTeacherAndDay,
      create: async (data: any) => {
        createdData = data;
        return data;
      },
    } as any,
    findChildIdsByParent: async () => [],
    findHistory: async () => [],
    findById: async () => null,
    notifySubmitted: async () => {
      notifications += 1;
    },
  });

  return {
    service,
    getCreatedData: () => createdData,
    getNotificationCount: () => notifications,
  };
};

const getRecentManilaDate = () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(yesterday);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
};

test("teacher can submit feeding for a past date", async () => {
  const harness = createService(async () => null);
  const date = getRecentManilaDate();

  const result = await harness.service.submit(
    { id: "teacher-1", role: "teacher", daycareCenterId: "center-1" },
    {
      clientOperationId: "11111111-1111-4111-8111-111111111111",
      date,
      foodServed: "Rice with Chicken Adobo",
      records: [{ child: "child-1", status: "completed", notes: "" }],
    },
  );

  assert.equal(result.isUpdate, false);
  assert.equal(
    harness.getCreatedData().date.toISOString(),
    new Date(`${date}T00:00:00+08:00`).toISOString(),
  );
  assert.equal(harness.getNotificationCount(), 1);
});

test("teacher cannot replace an existing past feeding session", async () => {
  const existing = {
    teacher: "teacher-1",
    foodServed: "Old menu",
    records: [],
  };
  const harness = createService(async () => existing);
  const date = getRecentManilaDate();

  await assert.rejects(
    () =>
      harness.service.submit(
        { id: "teacher-1", role: "teacher", daycareCenterId: "center-1" },
        {
          clientOperationId: "22222222-2222-4222-8222-222222222222",
          date,
          foodServed: "Pork Sinigang",
          records: [
            { child: "child-1", status: "missed", notes: "Late meal" },
          ],
        },
      ),
    (error: any) =>
      error?.statusCode === 409 && error?.code === "RECORD_ALREADY_EXISTS",
  );
});

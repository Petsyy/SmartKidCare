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

test("teacher can submit feeding for a past date", async () => {
  const harness = createService(async () => null);

  const result = await harness.service.submit(
    { id: "teacher-1", role: "teacher", daycareCenterId: "center-1" },
    {
      date: "2026-09-12",
      foodServed: "Rice with Chicken Adobo",
      records: [{ child: "child-1", status: "completed", notes: "" }],
    },
  );

  assert.equal(result.isUpdate, false);
  assert.equal(harness.getCreatedData().date.toISOString(), "2026-09-11T16:00:00.000Z");
  assert.equal(harness.getNotificationCount(), 1);
});

test("teacher can resubmit an existing past feeding session", async () => {
  let saved = false;
  const existing = {
    foodServed: "Old menu",
    records: [],
    save: async () => {
      saved = true;
    },
  };
  const harness = createService(async () => existing);

  const result = await harness.service.submit(
    { id: "teacher-1", role: "teacher", daycareCenterId: "center-1" },
    {
      date: "2026-09-12",
      foodServed: "Pork Sinigang",
      records: [{ child: "child-1", status: "missed", notes: "Late meal" }],
    },
  );

  assert.equal(result.isUpdate, true);
  assert.equal(existing.foodServed, "Pork Sinigang");
  assert.deepEqual(existing.records, [
    { child: "child-1", status: "missed", notes: "Late meal" },
  ]);
  assert.equal(saved, true);
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NotificationsAttendanceRepository,
  NotificationsChildRepository,
  NotificationsFeedingRepository,
  NotificationsParentNotificationRepository,
} from "../src/modules/notifications/repositories/notifications.repository";

const captureFindFilter = (repository: object, method: "find" | "findOne") => {
  let filter: Record<string, any> | undefined;
  const query = {
    select: () => query,
    sort: () => query,
    lean: async () => [],
  };
  (repository as any).model = {
    [method]: (value: Record<string, any>) => {
      filter = value;
      return query;
    },
  };
  return () => filter;
};

describe("notification history queries", () => {
  it("matches attendance across the complete Manila calendar day", async () => {
    const repository = new NotificationsAttendanceRepository();
    const getFilter = captureFindFilter(repository, "find");

    await repository.findByChildIdsAndDate(
      ["507f1f77bcf86cd799439011"],
      new Date("2026-10-18T04:00:00.000Z"),
    );

    const range = getFilter()?.date;
    assert.equal(range.$gte.toISOString(), "2026-10-17T16:00:00.000Z");
    assert.equal(range.$lte.toISOString(), "2026-10-18T15:59:59.999Z");
  });

  it("uses the same Manila-day range for feeding history", async () => {
    const repository = new NotificationsFeedingRepository();
    const getFilter = captureFindFilter(repository, "find");

    await repository.findByChildIdsAndDate(
      ["507f1f77bcf86cd799439011"],
      new Date("2026-10-18T04:00:00.000Z"),
    );

    const range = getFilter()?.date;
    assert.equal(range.$gte.toISOString(), "2026-10-17T16:00:00.000Z");
    assert.equal(range.$lte.toISOString(), "2026-10-18T15:59:59.999Z");
  });

  it("keeps archived children in a parent's notification history", async () => {
    const repository = new NotificationsChildRepository();
    const getFilter = captureFindFilter(repository, "find");

    await repository.findByParent("507f1f77bcf86cd799439011");

    assert.deepEqual(getFilter(), { parent: "507f1f77bcf86cd799439011" });
  });

  it("scopes persisted pickup reminders to the parent and selected Manila day", async () => {
    const repository = new NotificationsParentNotificationRepository();
    const getFilter = captureFindFilter(repository, "find");

    await repository.findByParentAndDate(
      "507f1f77bcf86cd799439011",
      new Date("2026-10-18T04:00:00.000Z"),
    );

    const filter = getFilter();
    assert.equal(filter?.recipient, "507f1f77bcf86cd799439011");
    assert.equal(filter?.createdAt.$gte.toISOString(), "2026-10-17T16:00:00.000Z");
    assert.equal(filter?.createdAt.$lte.toISOString(), "2026-10-18T15:59:59.999Z");
  });
});

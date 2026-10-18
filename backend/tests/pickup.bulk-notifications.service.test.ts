import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sendBulkPickupNotificationsOperation } from "../src/modules/pickup/services/pickup-notification.service";
import { validateBulkPickupNotifications } from "../src/modules/pickup/validators/pickup.validator";
import type {
  PickupNotificationChild,
  PickupNotificationServiceDependencies,
} from "../src/modules/pickup/types/pickup-notification.types";

const CHILD_1 = "507f1f77bcf86cd799439011";
const CHILD_2 = "507f1f77bcf86cd799439012";
const TEACHER = "507f1f77bcf86cd799439013";
const CENTER = "507f1f77bcf86cd799439014";
const PARENT = "507f1f77bcf86cd799439015";
const NOW = new Date("2026-10-18T08:00:00.000Z");

const child = (overrides: Partial<PickupNotificationChild> = {}): PickupNotificationChild => ({
  _id: CHILD_1,
  firstName: "Ana",
  lastName: "Santos",
  status: "Active",
  teacher: TEACHER,
  daycareCenter: CENTER,
  parent: {
    _id: PARENT,
    role: "parent",
    isActive: true,
    pushTokens: [{ token: "ExponentPushToken[test]" }],
  },
  ...overrides,
});

const dependencies = (
  overrides: Partial<PickupNotificationServiceDependencies> = {},
): PickupNotificationServiceDependencies => ({
  repository: {
    findChildrenByIds: async () => [child()],
    findPresentChildIds: async () => [CHILD_1],
    findReleasedChildIds: async () => [],
    findRecentlyAlertedChildIds: async () => [],
    createAlert: async () => {},
  },
  now: () => NOW,
  parseDayRange: () => ({
    start: new Date("2026-10-17T16:00:00.000Z"),
    end: new Date("2026-10-18T15:59:59.999Z"),
  }),
  extractTokens: () => ["ExponentPushToken[test]"],
  sendPush: async () => ({
    requested: 1,
    accepted: 1,
    rejected: 0,
    invalidTokens: [],
    tickets: [],
    errors: [],
  }),
  ...overrides,
});

const teacher = {
  id: TEACHER,
  role: "teacher" as const,
  daycareCenterId: CENTER,
};

describe("bulk pickup notifications", () => {
  it("persists an in-app alert before delivering push", async () => {
    const events: string[] = [];
    const deps = dependencies({
      repository: {
        ...dependencies().repository,
        createAlert: async () => { events.push("persisted"); },
      },
      sendPush: async () => {
        events.push("pushed");
        return { requested: 1, accepted: 1, rejected: 0, invalidTokens: [], tickets: [], errors: [] };
      },
    });

    const result = await sendBulkPickupNotificationsOperation(
      teacher,
      { childIds: [CHILD_1] },
      deps,
    );

    assert.deepEqual(events, ["persisted", "pushed"]);
    assert.equal(result.sent, 1);
    assert.equal(result.pushDelivered, 1);
    assert.equal(result.details[0].status, "sent");
  });

  it("rejects a child outside the teacher assignment", async () => {
    const deps = dependencies({
      repository: {
        ...dependencies().repository,
        findChildrenByIds: async () => [child({ teacher: CHILD_2 })],
      },
    });

    await assert.rejects(
      () => sendBulkPickupNotificationsOperation(teacher, { childIds: [CHILD_1] }, deps),
      { name: "ForbiddenError" },
    );
  });

  it("skips children that are absent, released, cooling down, or missing a parent", async () => {
    const children = [
      child(),
      child({ _id: CHILD_2, firstName: "Ben", parent: null }),
    ];
    const deps = dependencies({
      repository: {
        ...dependencies().repository,
        findChildrenByIds: async () => children,
        findPresentChildIds: async () => [CHILD_1, CHILD_2],
        findReleasedChildIds: async () => [CHILD_1],
        findRecentlyAlertedChildIds: async () => [],
      },
    });

    const result = await sendBulkPickupNotificationsOperation(
      teacher,
      { childIds: [CHILD_1, CHILD_2] },
      deps,
    );

    assert.deepEqual(result.details.map((item) => item.status), ["already_released", "missing_parent"]);
    assert.equal(result.skipped, 2);
  });

  it("keeps the in-app alert when push delivery fails", async () => {
    let persisted = false;
    const deps = dependencies({
      repository: {
        ...dependencies().repository,
        createAlert: async () => { persisted = true; },
      },
      sendPush: async () => { throw new Error("Expo unavailable"); },
    });

    const result = await sendBulkPickupNotificationsOperation(
      teacher,
      { childIds: [CHILD_1] },
      deps,
    );

    assert.equal(persisted, true);
    assert.equal(result.sent, 1);
    assert.equal(result.pushFailed, 1);
    assert.equal(result.details[0].status, "push_failed");
  });

  it("reports a successful in-app alert when the parent has no push token", async () => {
    let pushCalled = false;
    const deps = dependencies({
      extractTokens: () => [],
      sendPush: async () => {
        pushCalled = true;
        throw new Error("should not be called");
      },
    });

    const result = await sendBulkPickupNotificationsOperation(
      teacher,
      { childIds: [CHILD_1] },
      deps,
    );

    assert.equal(pushCalled, false);
    assert.equal(result.sent, 1);
    assert.equal(result.details[0].status, "sent");
  });

  it("reports partial Expo rejection without removing the in-app alert", async () => {
    const deps = dependencies({
      sendPush: async () => ({
        requested: 2,
        accepted: 1,
        rejected: 1,
        invalidTokens: ["invalid"],
        tickets: [],
        errors: ["One token was rejected."],
      }),
    });

    const result = await sendBulkPickupNotificationsOperation(
      teacher,
      { childIds: [CHILD_1] },
      deps,
    );

    assert.equal(result.sent, 1);
    assert.equal(result.pushDelivered, 1);
    assert.equal(result.pushFailed, 1);
    assert.equal(result.details[0].status, "push_failed");
  });

  it("skips an active child who is not present today", async () => {
    const deps = dependencies({
      repository: {
        ...dependencies().repository,
        findPresentChildIds: async () => [],
      },
    });

    const result = await sendBulkPickupNotificationsOperation(
      teacher,
      { childIds: [CHILD_1] },
      deps,
    );

    assert.equal(result.details[0].status, "not_present");
    assert.equal(result.skipped, 1);
  });

  it("enforces the recent-alert cooldown", async () => {
    const deps = dependencies({
      repository: {
        ...dependencies().repository,
        findRecentlyAlertedChildIds: async () => [CHILD_1],
      },
    });

    const result = await sendBulkPickupNotificationsOperation(
      teacher,
      { childIds: [CHILD_1] },
      deps,
    );

    assert.equal(result.details[0].status, "cooldown");
    assert.equal(result.sent, 0);
  });
});

describe("bulk pickup notification validation", () => {
  it("rejects empty, duplicate, malformed, and oversized child ID arrays", () => {
    assert.equal(validateBulkPickupNotifications.safeParse({ childIds: [] }).success, false);
    assert.equal(validateBulkPickupNotifications.safeParse({ childIds: [CHILD_1, CHILD_1] }).success, false);
    assert.equal(validateBulkPickupNotifications.safeParse({ childIds: ["bad-id"] }).success, false);
    assert.equal(
      validateBulkPickupNotifications.safeParse({
        childIds: Array.from({ length: 101 }, (_, index) => index.toString(16).padStart(24, "0")),
      }).success,
      false,
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ConcernStatus } from "../src/models/ParentConcern";
import { ConcernService } from "../src/modules/concerns/services/concern.service";
import type {
  ConcernDocument,
  ConcernRepository,
  ConcernServiceDependencies,
} from "../src/modules/concerns/types/concern.types";

const IDS = {
  parent: "64b000000000000000000001",
  otherParent: "64b000000000000000000002",
  captain: "64b000000000000000000003",
  child: "64b000000000000000000004",
  center: "64b000000000000000000005",
  otherCenter: "64b000000000000000000006",
  concern: "64b000000000000000000007",
};

const fixedNow = new Date("2026-09-24T02:00:00.000Z");

function concernDocument(status: ConcernStatus = "new") {
  return {
    _id: IDS.concern,
    parent: IDS.parent,
    child: IDS.child,
    daycareCenter: IDS.center,
    category: "attendance",
    subject: "Attendance concern",
    status,
    messages: [],
    statusHistory: [],
    lastActivityAt: new Date("2026-09-23T02:00:00.000Z"),
    acknowledgedAt: null,
    resolvedAt: status === "resolved" ? new Date("2026-09-23T03:00:00.000Z") : null,
    closedAt: null,
  } as unknown as ConcernDocument;
}

function createDependencies(overrides: Partial<ConcernServiceDependencies> = {}) {
  let storedConcern = concernDocument();
  const notifications: Array<{ type: string; concernId: string }> = [];
  const repository: ConcernRepository = {
    findOwnedChild: async (childId, parentId) =>
      childId === IDS.child && parentId === IDS.parent
        ? { _id: IDS.child, daycareCenter: IDS.center }
        : null,
    create: async (data) => {
      storedConcern = {
        ...concernDocument("new"),
        ...data,
      } as ConcernDocument;
      return storedConcern;
    },
    findDocumentById: async (id, scope) => {
      if (id !== IDS.concern) return null;
      if (scope.parent && scope.parent !== IDS.parent) return null;
      if (scope.daycareCenter && scope.daycareCenter !== IDS.center) return null;
      return storedConcern;
    },
    findDetailById: async (id, scope) => {
      if (id !== IDS.concern) return null;
      if (scope.parent && scope.parent !== IDS.parent) return null;
      if (scope.daycareCenter && scope.daycareCenter !== IDS.center) return null;
      return storedConcern;
    },
    list: async () => ({ rows: [storedConcern], total: 1 }),
    save: async (concern) => {
      storedConcern = concern;
      return concern;
    },
  };
  const deps: ConcernServiceDependencies = {
    repository,
    getConfiguredCenterId: async () => IDS.center,
    notifyParent: async (notification) => {
      notifications.push(notification);
    },
    now: () => fixedNow,
    ...overrides,
  };
  return {
    deps,
    notifications,
    setConcern: (concern: ConcernDocument) => {
      storedConcern = concern;
    },
    getConcern: () => storedConcern,
  };
}

describe("ConcernService", () => {
  it("should create a concern only for a child linked to the parent", async () => {
    const setup = createDependencies();
    const service = new ConcernService(setup.deps);
    const result = await service.create(
      { id: IDS.parent, role: "parent", daycareCenterId: null },
      {
        childId: IDS.child,
        category: "attendance",
        subject: "Attendance concern",
        message: "Please verify today's attendance.",
      },
    );

    assert.ok(result);
    assert.equal(setup.getConcern().status, "new");
    assert.equal(setup.getConcern().messages.length, 1);
    assert.equal(setup.getConcern().statusHistory[0]?.newStatus, "new");
  });

  it("should hide an unowned child behind NotFoundError", async () => {
    const setup = createDependencies();
    const service = new ConcernService(setup.deps);
    await assert.rejects(
      () =>
        service.create(
          { id: IDS.otherParent, role: "parent", daycareCenterId: null },
          {
            childId: IDS.child,
            category: "attendance",
            subject: "Attendance concern",
            message: "Please verify today's attendance.",
          },
        ),
      { name: "NotFoundError" },
    );
  });

  it("should reject a captain assigned to another center", async () => {
    const setup = createDependencies();
    const service = new ConcernService(setup.deps);
    await assert.rejects(
      () =>
        service.list(
          { id: IDS.captain, role: "barangay_captain", daycareCenterId: IDS.otherCenter },
          { page: 1, limit: 20 },
        ),
      { name: "ForbiddenError" },
    );
  });

  it("should automatically acknowledge the first captain reply", async () => {
    const setup = createDependencies();
    const service = new ConcernService(setup.deps);
    await service.addMessage(
      { id: IDS.captain, role: "barangay_captain", daycareCenterId: IDS.center },
      IDS.concern,
      { message: "We have received your concern." },
    );

    assert.equal(setup.getConcern().status, "acknowledged");
    assert.equal(setup.getConcern().messages.length, 1);
    assert.equal(setup.getConcern().statusHistory[0]?.previousStatus, "new");
    assert.equal(setup.notifications[0]?.type, "concern_reply");
  });

  it("should reopen a resolved concern after a parent follow-up", async () => {
    const setup = createDependencies();
    setup.setConcern(concernDocument("resolved"));
    const service = new ConcernService(setup.deps);
    await service.addMessage(
      { id: IDS.parent, role: "parent", daycareCenterId: null },
      IDS.concern,
      { message: "I still need help with this." },
    );

    assert.equal(setup.getConcern().status, "in_progress");
    assert.equal(setup.getConcern().resolvedAt, null);
    assert.match(setup.getConcern().statusHistory[0]?.note ?? "", /Reopened/);
  });

  it("should reject replies to a closed concern", async () => {
    const setup = createDependencies();
    setup.setConcern(concernDocument("closed"));
    const service = new ConcernService(setup.deps);
    await assert.rejects(
      () =>
        service.addMessage(
          { id: IDS.parent, role: "parent", daycareCenterId: null },
          IDS.concern,
          { message: "Another reply" },
        ),
      { name: "ConflictError" },
    );
  });

  it("should enforce sequential captain status transitions", async () => {
    const setup = createDependencies();
    const service = new ConcernService(setup.deps);
    await assert.rejects(
      () =>
        service.updateStatus(
          { id: IDS.captain, role: "barangay_captain", daycareCenterId: IDS.center },
          IDS.concern,
          { status: "resolved" },
        ),
      { name: "ConflictError" },
    );
  });

  it("should advance through every valid captain status transition", async () => {
    const setup = createDependencies();
    const service = new ConcernService(setup.deps);
    const captain = {
      id: IDS.captain,
      role: "barangay_captain",
      daycareCenterId: IDS.center,
    };

    await service.updateStatus(captain, IDS.concern, { status: "acknowledged" });
    await service.updateStatus(captain, IDS.concern, { status: "in_progress" });
    await service.updateStatus(captain, IDS.concern, {
      status: "resolved",
      note: "The attendance record was corrected.",
    });
    await service.updateStatus(captain, IDS.concern, { status: "closed" });

    assert.equal(setup.getConcern().status, "closed");
    assert.equal(setup.getConcern().statusHistory.length, 4);
    assert.equal(setup.getConcern().statusHistory[2]?.note, "The attendance record was corrected.");
    assert.equal(setup.notifications.length, 4);
  });

  it("should prevent a parent from explicitly changing status", async () => {
    const setup = createDependencies();
    const service = new ConcernService(setup.deps);
    await assert.rejects(
      () =>
        service.updateStatus(
          { id: IDS.parent, role: "parent", daycareCenterId: null },
          IDS.concern,
          { status: "acknowledged" },
        ),
      { name: "ForbiddenError" },
    );
  });

  it("should keep a saved captain reply when push delivery fails", async () => {
    const setup = createDependencies({
      notifyParent: async () => {
        throw new Error("Push unavailable");
      },
    });
    const service = new ConcernService(setup.deps);
    const result = await service.addMessage(
      { id: IDS.captain, role: "barangay_captain", daycareCenterId: IDS.center },
      IDS.concern,
      { message: "Saved even without push." },
    );

    assert.ok(result);
    assert.equal(setup.getConcern().messages[0]?.body, "Saved even without push.");
  });
});

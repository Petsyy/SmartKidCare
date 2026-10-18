import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompetencyNotificationService } from "../src/modules/competencies/services/competency-notification.service";
import type { CompetencyNotificationInput, CompetencyNotificationServiceDependencies } from "../src/modules/competencies/types/competency.types";

const input: CompetencyNotificationInput = {
  evaluationId: "evaluation-1", childId: "child-1", childName: "Ana Cruz",
  parentId: "parent-1", teacherId: "teacher-1", centerId: "center-1", status: "submitted",
  entries: [
    { name: "Counts objects", level: "emerging", remarks: "Practice with toys." },
    { name: "Writes name", level: "not_demonstrated", remarks: "Trace letters." },
    { name: "Shares materials", level: "achieved", remarks: "Doing well." },
  ],
};

const makeDependencies = (overrides: Partial<CompetencyNotificationServiceDependencies> = {}) => {
  const alerts: Array<Record<string, string>> = [];
  const pushes: Array<{ body: string }> = [];
  const dependencies: CompetencyNotificationServiceDependencies = {
    repository: {
      findActiveParent: async () => ({ _id: "parent-1", role: "parent", isActive: true, pushToken: "ExponentPushToken[test]" }),
      createAlert: async (alert) => { alerts.push(alert); },
    },
    extractTokens: () => ["ExponentPushToken[test]"],
    sendPush: async (push) => { pushes.push(push); return { accepted: 1, rejected: 0 }; },
    ...overrides,
  };
  return { dependencies, alerts, pushes };
};

describe("CompetencyNotificationService", () => {
  it("creates one detailed alert and one privacy-safe push", async () => {
    const { dependencies, alerts, pushes } = makeDependencies();
    const result = await new CompetencyNotificationService(dependencies).notify(input);
    assert.equal(result.status, "created");
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].uniqueKey, "competency_practice:evaluation-1");
    assert.match(alerts[0].message, /Counts objects/);
    assert.match(alerts[0].message, /Practice with toys/);
    assert.doesNotMatch(alerts[0].message, /Shares materials/);
    assert.equal(pushes[0].body, "Ana Cruz has 2 skills to practice. Open SmartKidCare to review the teacher’s remarks.");
    assert.doesNotMatch(pushes[0].body, /Counts objects|Trace letters/);
  });

  it("skips drafts and evaluations without low ratings", async () => {
    const { dependencies, alerts } = makeDependencies();
    const service = new CompetencyNotificationService(dependencies);
    assert.equal((await service.notify({ ...input, status: "draft" })).status, "skipped");
    assert.equal((await service.notify({ ...input, entries: [{ name: "Skill", level: "developing" }] })).status, "skipped");
    assert.equal(alerts.length, 0);
  });

  it("skips a missing or inactive parent", async () => {
    const { dependencies, alerts } = makeDependencies({
      repository: { findActiveParent: async () => null, createAlert: async (alert) => { alerts.push(alert); } },
    });
    assert.equal((await new CompetencyNotificationService(dependencies).notify(input)).status, "skipped");
    assert.equal(alerts.length, 0);
  });

  it("reports a duplicate without another push", async () => {
    const { dependencies, pushes } = makeDependencies({
      repository: {
        findActiveParent: async () => ({ _id: "parent-1", isActive: true }),
        createAlert: async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); },
      },
    });
    assert.equal((await new CompetencyNotificationService(dependencies).notify(input)).status, "duplicate");
    assert.equal(pushes.length, 0);
  });

  it("preserves the alert without a token and after push failure", async () => {
    const noToken = makeDependencies({ extractTokens: () => [] });
    assert.equal((await new CompetencyNotificationService(noToken.dependencies).notify(input)).status, "created");
    assert.equal(noToken.alerts.length, 1);
    const failed = makeDependencies({ sendPush: async () => ({ accepted: 0, rejected: 1 }) });
    assert.equal((await new CompetencyNotificationService(failed.dependencies).notify(input)).status, "push_failed");
    assert.equal(failed.alerts.length, 1);
  });

  it("limits the stored message to 1,000 characters", async () => {
    const { dependencies, alerts } = makeDependencies();
    await new CompetencyNotificationService(dependencies).notify({ ...input, entries: [{ name: "Long skill", level: "emerging", remarks: "x".repeat(1200) }] });
    assert.equal(alerts[0].message.length, 1000);
    assert.ok(alerts[0].message.endsWith("…"));
  });
});

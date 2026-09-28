import assert from "node:assert/strict";
import { describe, it } from "node:test";
import OfflineSyncSnapshot from "../src/models/OfflineSyncSnapshot";
import { OFFLINE_RESOURCES } from "../src/modules/offline-sync/types/offline-sync.types";

describe("offline snapshot contract", () => {
  it("includes every full offline-read resource exactly once", () => {
    assert.equal(new Set(OFFLINE_RESOURCES).size, OFFLINE_RESOURCES.length);
    for (const resource of [
      "children", "attendance", "feeding", "nutrition",
      "competencyDefinitions", "competencyEvaluations", "profiles",
      "guardianSummaries", "enrollmentReference", "pickupStatuses",
      "pickupHistory", "notifications",
    ]) assert.ok(OFFLINE_RESOURCES.includes(resource as (typeof OFFLINE_RESOURCES)[number]));
  });

  it("persists the required-resource activation flag", () => {
    const snapshot = new OfflineSyncSnapshot({
      owner: "507f1f77bcf86cd799439011",
      role: "teacher",
      expiresAt: new Date(Date.now() + 60_000),
      resources: [{ resource: "children", required: true, itemCount: 0, pageCount: 0, checksum: "abc" }],
    });
    const error = snapshot.validateSync();
    assert.equal(error, undefined);
    assert.equal(snapshot.resources[0]?.required, true);
  });
});

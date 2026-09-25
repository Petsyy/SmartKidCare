import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CaptainActivationService } from "../src/modules/auth/services/captain-activation.service";

const fixedNow = new Date("2026-09-23T00:00:00.000Z");

const makeCaptain = (overrides: Record<string, unknown> = {}): any => ({
  _id: "captain-new",
  firstName: "Juan",
  email: "juan@example.com",
  password: "placeholder",
  daycareCenter: "center-1",
  isActive: false,
  mustChangePassword: true,
  captainOnboardingStatus: "invitation_pending",
  captainInvitationExpiresAt: new Date("2026-09-24T00:00:00.000Z"),
  save: async () => undefined,
  ...overrides,
});

const makeService = (captain: any, outgoing: any = null) => {
  const audits: any[] = [];
  const service = new CaptainActivationService({
    repository: {
      findCaptainInvitationByHash: async () => captain,
      findCaptainById: async () => outgoing,
      createAuditEvent: async (event: any) => { audits.push(event); },
    } as any,
    hashPassword: async () => "hashed-password",
    now: () => fixedNow,
  });
  return { service, audits };
};

describe("CaptainActivationService", () => {
  it("rejects an invalid invitation", async () => {
    const { service } = makeService(null);
    await assert.rejects(() => service.validate("invalid"), /invalid, revoked, or already used/i);
  });

  it("rejects an expired invitation", async () => {
    const captain = makeCaptain({ captainInvitationExpiresAt: new Date("2026-09-22T00:00:00.000Z") });
    const { service } = makeService(captain);
    await assert.rejects(() => service.validate("token"), /expired/i);
  });

  it("activates the invited captain and deactivates the outgoing captain", async () => {
    const outgoing = makeCaptain({ _id: "captain-old", isActive: true, captainOnboardingStatus: "active" });
    const captain = makeCaptain({ captainReplaces: outgoing._id });
    const { service, audits } = makeService(captain, outgoing);

    await service.activate("token", "Strong!Password");

    assert.equal(captain.isActive, true);
    assert.equal(captain.password, "hashed-password");
    assert.equal(captain.captainInvitationTokenHash, undefined);
    assert.equal(outgoing.isActive, false);
    assert.deepEqual(audits.map((event) => event.action), [
      "CAPTAIN_ACCOUNT_DEACTIVATED",
      "CAPTAIN_ACCOUNT_ACTIVATED",
    ]);
  });

  it("restores the outgoing captain if activation persistence fails", async () => {
    let outgoingSaveCount = 0;
    const outgoing = makeCaptain({
      _id: "captain-old",
      isActive: true,
      captainOnboardingStatus: "active",
      save: async () => { outgoingSaveCount += 1; },
    });
    const captain = makeCaptain({
      captainReplaces: outgoing._id,
      save: async () => { throw new Error("database failure"); },
    });
    const { service } = makeService(captain, outgoing);

    await assert.rejects(() => service.activate("token", "Strong!Password"), /database failure/);
    assert.equal(outgoing.isActive, true);
    assert.equal(outgoing.captainOnboardingStatus, "active");
    assert.equal(outgoingSaveCount, 2);
  });
});

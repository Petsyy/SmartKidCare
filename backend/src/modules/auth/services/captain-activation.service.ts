import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import {
  ConflictError,
  UnauthorizedError,
} from "../../../shared/errors/app-error";
import { authUserRepository } from "../repositories/auth.repository";

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export interface CaptainActivationDependencies {
  repository: Pick<
    typeof authUserRepository,
    "findCaptainInvitationByHash" | "findCaptainById" | "createAuditEvent"
  >;
  hashPassword: (password: string) => Promise<string>;
  now: () => Date;
}

const defaultDependencies: CaptainActivationDependencies = {
  repository: authUserRepository,
  hashPassword: (password) => bcrypt.hash(password, 12),
  now: () => new Date(),
};

export class CaptainActivationService {
  constructor(private readonly deps: CaptainActivationDependencies = defaultDependencies) {}

  private async getPendingInvitation(token: string) {
    const captain = await this.deps.repository.findCaptainInvitationByHash(
      hashToken(token),
    );
    if (!captain || captain.captainOnboardingStatus !== "invitation_pending") {
      throw new UnauthorizedError("Invitation is invalid, revoked, or already used.");
    }
    if (
      !captain.captainInvitationExpiresAt ||
      captain.captainInvitationExpiresAt.getTime() <= this.deps.now().getTime()
    ) {
      throw new UnauthorizedError("Invitation has expired. Ask the System Administrator to resend it.");
    }
    return captain;
  }

  async validate(token: string) {
    const captain = await this.getPendingInvitation(token);
    return {
      firstName: captain.firstName,
      email: captain.email,
      expiresAt: captain.captainInvitationExpiresAt,
    };
  }

  async activate(token: string, newPassword: string) {
    const captain = await this.getPendingInvitation(token);
    const outgoing = captain.captainReplaces
      ? await this.deps.repository.findCaptainById(String(captain.captainReplaces))
      : null;
    if (outgoing && outgoing.isActive !== true) {
      throw new ConflictError("The captain being replaced is no longer active.");
    }

    try {
      if (outgoing) {
        outgoing.isActive = false;
        outgoing.captainOnboardingStatus = "inactive";
        await outgoing.save();
      }
      captain.password = await this.deps.hashPassword(newPassword);
      captain.isActive = true;
      captain.mustChangePassword = false;
      captain.adminMfaEnabled = true;
      captain.captainOnboardingStatus = "active";
      captain.captainInvitationActivatedAt = this.deps.now();
      captain.captainInvitationTokenHash = undefined;
      captain.captainInvitationExpiresAt = undefined;
      captain.latestTempPassword = undefined;
      captain.latestTempPasswordIssuedAt = undefined;
      await captain.save();
    } catch (error) {
      if (outgoing) {
        outgoing.isActive = true;
        outgoing.captainOnboardingStatus = "active";
        await outgoing.save();
      }
      throw error;
    }

    if (outgoing) {
      await this.deps.repository.createAuditEvent({
        action: "CAPTAIN_ACCOUNT_DEACTIVATED",
        targetUser: String(outgoing._id),
        daycareCenter: outgoing.daycareCenter ? String(outgoing.daycareCenter) : null,
        metadata: { replacementCaptainId: String(captain._id) },
      });
    }
    await this.deps.repository.createAuditEvent({
      action: "CAPTAIN_ACCOUNT_ACTIVATED",
      targetUser: String(captain._id),
      daycareCenter: captain.daycareCenter ? String(captain.daycareCenter) : null,
    });
    return { message: "Account activated. You can now sign in." };
  }
}

export const captainActivationService = new CaptainActivationService();

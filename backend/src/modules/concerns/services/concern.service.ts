import mongoose from "mongoose";
import type { ConcernStatus } from "../../../models/ParentConcern";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../shared/errors/app-error";
import { assertCaptainCenter } from "../../../shared/services/child-access.service";
import { getSingleCenterId } from "../../../shared/services/single-center.service";
import { notifyParentAboutConcern } from "../../notifications/services/concern-notification.service";
import { concernRepository } from "../repositories/concern.repository";
import type {
  AddConcernMessageInput,
  ConcernDocument,
  ConcernScope,
  ConcernServiceDependencies,
  ConcernServiceUser,
  CreateConcernInput,
  ListConcernsInput,
  UpdateConcernStatusInput,
} from "../types/concern.types";

const NEXT_STATUS: Partial<Record<ConcernStatus, ConcernStatus>> = {
  new: "acknowledged",
  acknowledged: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
};

const asId = (value: unknown): string => {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value ?? "");
};

const appendTransition = (
  concern: ConcernDocument,
  nextStatus: ConcernStatus,
  user: ConcernServiceUser,
  at: Date,
  note?: string,
) => {
  const previousStatus = concern.status;
  concern.status = nextStatus;
  concern.statusHistory.push({
    previousStatus,
    newStatus: nextStatus,
    changedBy: new mongoose.Types.ObjectId(user.id),
    changedByRole: user.role as "parent" | "barangay_captain",
    note: note || undefined,
    changedAt: at,
  });
  if (nextStatus === "acknowledged") concern.acknowledgedAt = at;
  if (nextStatus === "in_progress" && previousStatus === "resolved") {
    concern.resolvedAt = null;
  }
  if (nextStatus === "resolved") concern.resolvedAt = at;
  if (nextStatus === "closed") concern.closedAt = at;
};

const getScope = async (
  user: ConcernServiceUser,
  deps: ConcernServiceDependencies,
): Promise<ConcernScope> => {
  if (user.role === "parent") return { parent: user.id };
  if (user.role === "barangay_captain") {
    const centerId = await deps.getConfiguredCenterId();
    assertCaptainCenter(user, centerId);
    return { daycareCenter: centerId };
  }
  throw new ForbiddenError("Parents and Barangay Captains only");
};

const getScopedConcern = async (
  concernId: string,
  user: ConcernServiceUser,
  deps: ConcernServiceDependencies,
) => {
  const scope = await getScope(user, deps);
  const concern = await deps.repository.findDocumentById(concernId, scope);
  if (!concern) throw new NotFoundError("Concern");
  return { concern, scope };
};

const sendBestEffortNotification = async (
  deps: ConcernServiceDependencies,
  notification: Parameters<ConcernServiceDependencies["notifyParent"]>[0],
) => {
  try {
    await deps.notifyParent(notification);
  } catch (error) {
    console.warn(
      "Concern notification dispatch failed:",
      notification.concernId,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};

export class ConcernService {
  constructor(private readonly deps: ConcernServiceDependencies) {}

  async create(user: ConcernServiceUser, input: CreateConcernInput) {
    if (user.role !== "parent") throw new ForbiddenError("Parents only");
    const child = await this.deps.repository.findOwnedChild(input.childId, user.id);
    if (!child?.daycareCenter) throw new NotFoundError("Child");

    const configuredCenterId = await this.deps.getConfiguredCenterId();
    if (asId(child.daycareCenter) !== configuredCenterId) {
      throw new NotFoundError("Child");
    }

    const now = this.deps.now();
    const concern = await this.deps.repository.create({
      parent: new mongoose.Types.ObjectId(user.id),
      child: new mongoose.Types.ObjectId(input.childId),
      daycareCenter: new mongoose.Types.ObjectId(configuredCenterId),
      category: input.category,
      subject: input.subject,
      status: "new",
      messages: [
        {
          sender: new mongoose.Types.ObjectId(user.id),
          senderRole: "parent",
          body: input.message,
          createdAt: now,
        },
      ],
      statusHistory: [
        {
          previousStatus: null,
          newStatus: "new",
          changedBy: new mongoose.Types.ObjectId(user.id),
          changedByRole: "parent",
          changedAt: now,
        },
      ],
      lastActivityAt: now,
    });

    return this.deps.repository.findDetailById(String(concern._id), { parent: user.id });
  }

  async list(user: ConcernServiceUser, input: ListConcernsInput) {
    const scope = await getScope(user, this.deps);
    const { rows, total } = await this.deps.repository.list(
      scope,
      { status: input.status, category: input.category },
      input.page,
      input.limit,
    );
    return {
      data: rows,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }

  async getById(user: ConcernServiceUser, concernId: string) {
    const scope = await getScope(user, this.deps);
    const concern = await this.deps.repository.findDetailById(concernId, scope);
    if (!concern) throw new NotFoundError("Concern");
    return concern;
  }

  async addMessage(
    user: ConcernServiceUser,
    concernId: string,
    input: AddConcernMessageInput,
  ) {
    const { concern, scope } = await getScopedConcern(concernId, user, this.deps);
    if (concern.status === "closed") {
      throw new ConflictError("Closed concerns are read-only. Submit a new concern instead.");
    }

    const now = this.deps.now();
    if (user.role === "barangay_captain" && concern.status === "new") {
      appendTransition(concern, "acknowledged", user, now);
    } else if (user.role === "parent" && concern.status === "resolved") {
      appendTransition(
        concern,
        "in_progress",
        user,
        now,
        "Reopened automatically after a parent follow-up.",
      );
    }

    concern.messages.push({
      sender: new mongoose.Types.ObjectId(user.id),
      senderRole: user.role as "parent" | "barangay_captain",
      body: input.message,
      createdAt: now,
    });
    concern.lastActivityAt = now;
    await this.deps.repository.save(concern);

    if (user.role === "barangay_captain") {
      await sendBestEffortNotification(this.deps, {
        parentId: asId(concern.parent),
        concernId: String(concern._id),
        type: "concern_reply",
        title: "Captain replied to your concern",
        body: "Tap to view the official response in Smart KidCare.",
      });
    }

    return this.deps.repository.findDetailById(concernId, scope);
  }

  async updateStatus(
    user: ConcernServiceUser,
    concernId: string,
    input: UpdateConcernStatusInput,
  ) {
    if (user.role !== "barangay_captain") {
      throw new ForbiddenError("Barangay Captains only");
    }
    const { concern, scope } = await getScopedConcern(concernId, user, this.deps);
    const expected = NEXT_STATUS[concern.status];
    if (!expected || input.status !== expected) {
      throw new ConflictError(
        expected
          ? `Concern must move from ${concern.status} to ${expected}.`
          : "Closed concerns cannot change status.",
      );
    }

    const now = this.deps.now();
    appendTransition(concern, input.status, user, now, input.note);
    concern.lastActivityAt = now;
    await this.deps.repository.save(concern);

    await sendBestEffortNotification(this.deps, {
      parentId: asId(concern.parent),
      concernId: String(concern._id),
      type: "concern_status_changed",
      title: "Concern status updated",
      body: `Your concern is now ${input.status.replace("_", " ")}.`,
    });

    return this.deps.repository.findDetailById(concernId, scope);
  }
}

export const concernService = new ConcernService({
  repository: concernRepository,
  getConfiguredCenterId: getSingleCenterId,
  notifyParent: notifyParentAboutConcern,
  now: () => new Date(),
});

import {
  extractUserPushTokens,
  sendExpoPushNotifications,
} from "../../notifications/services/push-notification.service";
import { competencyNotificationRepository } from "../repositories/competency-notification.repository";
import type {
  CompetencyNotificationInput,
  CompetencyNotificationResult,
  CompetencyNotificationServiceDependencies,
} from "../types/competency.types";

const TITLE = "Skills to Practice";
const PRACTICE_LEVELS = new Set(["not_demonstrated", "emerging"]);
const MAX_MESSAGE_LENGTH = 1000;

const truncate = (value: string): string =>
  value.length <= MAX_MESSAGE_LENGTH
    ? value
    : `${value.slice(0, MAX_MESSAGE_LENGTH - 1).trimEnd()}…`;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const buildMessage = (
  childName: string,
  entries: CompetencyNotificationInput["entries"],
): string => {
  const skillNames = entries.map((entry) => entry.name).join(", ");
  const remarks = entries
    .filter((entry) => entry.remarks?.trim())
    .map((entry) => `${entry.name}: ${entry.remarks!.trim()}`)
    .join("; ");
  return truncate(
    `${childName} needs practice with: ${skillNames}.${
      remarks ? ` Teacher remarks: ${remarks}` : ""
    }`,
  );
};

export const notifyCompetencyPracticeOperation = async (
  input: CompetencyNotificationInput,
  dependencies: CompetencyNotificationServiceDependencies,
): Promise<CompetencyNotificationResult> => {
  if (input.status !== "submitted") {
    return { status: "skipped", reason: "Draft evaluations do not notify parents." };
  }

  const affectedEntries = input.entries.filter((entry) =>
    PRACTICE_LEVELS.has(entry.level),
  );
  if (!affectedEntries.length) {
    return { status: "skipped", reason: "No skills require practice." };
  }
  if (!input.parentId) {
    return { status: "skipped", reason: "No active parent account is linked." };
  }

  const parent = await dependencies.repository.findActiveParent(input.parentId);
  if (!parent) {
    return { status: "skipped", reason: "No active parent account is linked." };
  }

  try {
    await dependencies.repository.createAlert({
      recipientId: String(parent._id),
      childId: input.childId,
      evaluationId: input.evaluationId,
      senderId: input.teacherId,
      centerId: input.centerId,
      title: TITLE,
      message: buildMessage(input.childName, affectedEntries),
      uniqueKey: `competency_practice:${input.evaluationId}`,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) return { status: "duplicate" };
    throw error;
  }

  const tokens = dependencies.extractTokens(parent);
  if (!tokens.length) {
    return { status: "created", reason: "In-app alert saved; no registered push token." };
  }

  const body = `${input.childName} has ${affectedEntries.length} skills to practice. Open SmartKidCare to review the teacher’s remarks.`;
  try {
    const push = await dependencies.sendPush({
      tokens,
      title: TITLE,
      body,
      data: {
        type: "competency_practice",
        childId: input.childId,
        evaluationId: input.evaluationId,
      },
    });
    if (push.accepted === 0 || push.rejected > 0) {
      return { status: "push_failed", reason: "In-app alert saved, but push delivery was incomplete." };
    }
    return { status: "created" };
  } catch {
    return { status: "push_failed", reason: "In-app alert saved, but push delivery failed." };
  }
};

export class CompetencyNotificationService {
  constructor(private readonly dependencies: CompetencyNotificationServiceDependencies) {}

  notify(input: CompetencyNotificationInput) {
    return notifyCompetencyPracticeOperation(input, this.dependencies);
  }
}

export const competencyNotificationService = new CompetencyNotificationService({
  repository: competencyNotificationRepository,
  extractTokens: extractUserPushTokens,
  sendPush: sendExpoPushNotifications,
});

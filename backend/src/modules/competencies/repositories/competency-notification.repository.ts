import ParentNotification from "../../../models/ParentNotification";
import Users from "../../../models/Users";
import type {
  CompetencyNotificationParent,
  CompetencyNotificationRepositoryContract,
} from "../types/competency.types";

export class CompetencyNotificationRepository
  implements CompetencyNotificationRepositoryContract
{
  async findActiveParent(id: string): Promise<CompetencyNotificationParent | null> {
    return Users.findOne({ _id: id, role: "parent", isActive: true })
      .select("role isActive pushToken pushTokens")
      .lean() as unknown as Promise<CompetencyNotificationParent | null>;
  }

  async createAlert(input: {
    recipientId: string;
    childId: string;
    evaluationId: string;
    senderId: string;
    centerId: string;
    title: string;
    message: string;
    uniqueKey: string;
  }): Promise<void> {
    await ParentNotification.create({
      recipient: input.recipientId,
      child: input.childId,
      evaluation: input.evaluationId,
      sender: input.senderId,
      daycareCenter: input.centerId,
      eventType: "competency_practice",
      title: input.title,
      message: input.message,
      cooldownKey: input.uniqueKey,
    });
  }
}

export const competencyNotificationRepository =
  new CompetencyNotificationRepository();

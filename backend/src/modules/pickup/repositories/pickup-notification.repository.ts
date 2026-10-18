import Attendance from "../../../models/Attendance";
import Child from "../../../models/Child";
import ParentNotification from "../../../models/ParentNotification";
import PickupRecord from "../../../models/PickupRecord";
import type {
  PickupNotificationChild,
  PickupNotificationRepositoryContract,
} from "../types/pickup-notification.types";

export class PickupNotificationRepository
  implements PickupNotificationRepositoryContract
{
  async findChildrenByIds(ids: string[]): Promise<PickupNotificationChild[]> {
    const children = await Child.find({ _id: { $in: ids } })
      .select("firstName lastName status teacher daycareCenter parent")
      .populate("parent", "role isActive pushToken pushTokens")
      .lean();
    return children as unknown as PickupNotificationChild[];
  }

  async findPresentChildIds(input: {
    teacherId: string;
    centerId: string;
    start: Date;
    end: Date;
  }): Promise<string[]> {
    const attendance = await Attendance.findOne({
      teacher: input.teacherId,
      daycareCenter: input.centerId,
      date: { $gte: input.start, $lte: input.end },
    })
      .select("records")
      .lean();

    return (attendance?.records || [])
      .filter((record: any) => record.status === "present")
      .map((record: any) => String(record.child));
  }

  async findReleasedChildIds(input: {
    childIds: string[];
    start: Date;
    end: Date;
  }): Promise<string[]> {
    const records = await PickupRecord.find({
      child: { $in: input.childIds },
      pickedUpAt: { $gte: input.start, $lte: input.end },
    })
      .select("child")
      .lean();
    return records.map((record: any) => String(record.child));
  }

  async findRecentlyAlertedChildIds(
    childIds: string[],
    since: Date,
  ): Promise<string[]> {
    const alerts = await ParentNotification.find({
      child: { $in: childIds },
      eventType: "pickup_reminder",
      createdAt: { $gte: since },
    })
      .select("child")
      .lean();
    return alerts.map((alert) => String(alert.child));
  }

  async createAlert(input: {
    recipientId: string;
    childId: string;
    senderId: string;
    centerId: string;
    title: string;
    message: string;
    cooldownKey: string;
  }): Promise<void> {
    await ParentNotification.create({
      recipient: input.recipientId,
      child: input.childId,
      sender: input.senderId,
      daycareCenter: input.centerId,
      eventType: "pickup_reminder",
      title: input.title,
      message: input.message,
      cooldownKey: input.cooldownKey,
    });
  }
}

export const pickupNotificationRepository = new PickupNotificationRepository();

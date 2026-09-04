import PickupRecord from "../../../models/PickupRecord";
import PickupCode from "../../../models/PickupCode";
import Child from "../../../models/Child";
import { BaseRepository } from "../../../shared/repositories/base.repository";

export class PickupRecordRepository extends BaseRepository<any> {
  constructor() {
    super(PickupRecord);
  }

  async findHistory(query: any): Promise<any[]> {
    return this.model
      .find(query)
      .populate("child", "firstName lastName studentId daycareCenter")
      .populate("verifiedByTeacher", "firstName lastName")
      .populate("daycareCenter", "name")
      .sort({ pickedUpAt: -1 })
      .lean();
  }

  async findPickupsToday(centerId: string, date: Date): Promise<any[]> {
    return this.model.find({ daycareCenter: centerId, pickedUpAt: { $gte: date } }).lean();
  }

  async findPickupStatus(childId: string, date: Date): Promise<any | null> {
    return this.model.findOne({ child: childId, pickedUpAt: { $gte: date } }).populate("verifiedByTeacher", "firstName lastName").lean();
  }
}

export class PickupCodeRepository extends BaseRepository<any> {
  constructor() {
    super(PickupCode);
  }

  async findValidCode(childId: string, codeHash: string): Promise<any | null> {
    return this.model.findOne({
      child: childId,
      codeHash: codeHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async findActiveCodes(childId: string): Promise<any[]> {
    return this.model.find({
      child: childId,
      used: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async invalidatePreviousCodes(childId: string): Promise<void> {
    await this.model.updateMany(
      { child: childId, used: false },
      { $set: { used: true } }
    );
  }
}

export const pickupRecordRepository = new PickupRecordRepository();
export const pickupCodeRepository = new PickupCodeRepository();

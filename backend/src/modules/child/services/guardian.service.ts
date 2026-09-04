import Child from "../../../models/Child";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../../shared/errors/app-error";

class GuardianService {
  public async addGuardian(user: any, childId: string, guardianData: any) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent" && String(child.parent) !== String(user.id)) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if ((child.authorizedPickupPersons?.length || 0) >= 5) {
      throw new ValidationError("Maximum of 5 guardians allowed");
    }

    child.authorizedPickupPersons = child.authorizedPickupPersons || [];
    child.authorizedPickupPersons.push(guardianData);
    await child.save();

    return child.authorizedPickupPersons;
  }

  public async updateGuardian(
    user: any,
    childId: string,
    guardianIndex: number,
    guardianData: any,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent" && String(child.parent) !== String(user.id)) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      !child.authorizedPickupPersons ||
      !child.authorizedPickupPersons[guardianIndex]
    ) {
      throw new NotFoundError("Guardian");
    }

    child.authorizedPickupPersons[guardianIndex] = {
      ...child.authorizedPickupPersons[guardianIndex],
      ...guardianData,
    };
    await child.save();

    return child.authorizedPickupPersons;
  }

  public async removeGuardian(
    user: any,
    childId: string,
    guardianIndex: number,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent" && String(child.parent) !== String(user.id)) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      !child.authorizedPickupPersons ||
      !child.authorizedPickupPersons[guardianIndex]
    ) {
      throw new NotFoundError("Guardian");
    }

    child.authorizedPickupPersons[guardianIndex].isActive = false;
    await child.save();
  }

  public async getGuardians(user: any, childId: string) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent" && String(child.parent) !== String(user.id)) {
      throw new ForbiddenError(
        "Not authorized to view guardians for this child",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to view guardians for this child",
      );
    }

    return child.authorizedPickupPersons || [];
  }
}

export const guardianService = new GuardianService();


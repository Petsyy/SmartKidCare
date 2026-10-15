import mongoose from "mongoose";
import {ConflictError,NotFoundError,ValidationError,
} from "../../../shared/errors/app-error";
import { parseDate } from "../../../shared/utils/date.utils";
import { childRepository } from "../repositories/child.repository";
import { assertCanAccessChild } from "../../../shared/services/child-access.service";
import type { AuthenticatedUser } from "../../../shared/types/auth.types";
import {
  calculateAgeInMonths,
  calculateBmi,
  classifyNutritionalStatus,
} from "../../../shared/utils/nutrition.utils";
import { pickupCodeRepository } from "../../pickup/repositories/pickup.repository";

export class ChildService {
  public async ensureNoDuplicate(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
  ) {
    const existingChild = await childRepository.findDuplicate(
      firstName,
      lastName,
      dateOfBirth,
    );
    if (existingChild) {
      throw new ConflictError("Child already exists");
    }
  }

  async createChild(payload: Record<string, any>) {
    return await childRepository.create(payload);
  }

  async updateChild(
    id: string,
    body: Record<string, any>,
    user: AuthenticatedUser | undefined,
  ) {
    const child = await childRepository.findById(id);
    if (!child) throw new NotFoundError("Child");
    assertCanAccessChild(user, child);
    if (child.status !== "Active") {
      throw new ValidationError("This child is archived and cannot receive new records.");
    }

    if (body.firstName !== undefined) child.firstName = body.firstName;
    if (body.middleName !== undefined) child.middleName = body.middleName;
    if (body.lastName !== undefined) child.lastName = body.lastName;
    if (body.dateOfBirth !== undefined)
      child.dateOfBirth = parseDate(body.dateOfBirth) || child.dateOfBirth;
    if (body.age !== undefined) child.age = Number(body.age);
    if (body.gender !== undefined) child.gender = body.gender;
    if (body.homeAddress !== undefined) child.homeAddress = body.homeAddress;
    if (body.parentRelationship !== undefined) child.parentRelationship = body.parentRelationship;
    if (body.weight !== undefined) child.weight = Number(body.weight);
    if (body.height !== undefined) child.height = Number(body.height);
    if (
      body.weight !== undefined ||
      body.height !== undefined ||
      body.dateOfBirth !== undefined ||
      body.gender !== undefined
    ) {
      if (child.weight && child.height) {
        child.bmi = calculateBmi(child.weight, child.height);
        child.nutritionalStatus = classifyNutritionalStatus(
          child.bmi,
          calculateAgeInMonths(child.dateOfBirth),
          child.gender,
        ) as never;
      }
    }
    if (body.schoolYear !== undefined) child.schoolYear = body.schoolYear;
    await child.save();
    return await childRepository.findByIdWithDetails(child._id.toString());
  }

  async archiveChild(
    id: string,
    body: { reason: string; note?: string },
    user: AuthenticatedUser | undefined,
  ) {
    const child = await childRepository.findById(id);
    if (!child) throw new NotFoundError("Child");
    assertCanAccessChild(user, child);
    if (!user?.id) throw new ValidationError("Authenticated teacher is required");
    if (child.status === "Inactive") {
      throw new ConflictError("Child is already archived");
    }

    const occurredAt = new Date();
    child.status = "Inactive";
    child.archivedAt = occurredAt;
    child.archivedBy = user.id;
    child.archiveReason = body.reason;
    child.archiveNote = body.note?.trim() || null;
    child.statusHistory = child.statusHistory || [];
    child.statusHistory.push({
      action: "archived",
      reason: body.reason,
      note: body.note?.trim() || null,
      actor: user.id,
      occurredAt,
    });
    await child.save();
    await pickupCodeRepository.invalidatePreviousCodes(id);
    return childRepository.findByIdWithDetails(id);
  }

  async restoreChild(id: string, user: AuthenticatedUser | undefined) {
    const child = await childRepository.findById(id);
    if (!child) throw new NotFoundError("Child");
    assertCanAccessChild(user, child);
    if (!user?.id) throw new ValidationError("Authenticated teacher is required");
    if (child.status === "Active") {
      throw new ConflictError("Child is already active");
    }

    child.status = "Active";
    child.archivedAt = null;
    child.archivedBy = null;
    child.archiveReason = null;
    child.archiveNote = null;
    child.statusHistory = child.statusHistory || [];
    child.statusHistory.push({
      action: "restored",
      actor: user.id,
      occurredAt: new Date(),
    });
    await child.save();
    return childRepository.findByIdWithDetails(id);
  }

  async deleteChild(id: string, user: AuthenticatedUser | undefined) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid child ID");
    const child = await childRepository.findById(id);
    if (!child) throw new NotFoundError("Child");
    assertCanAccessChild(user, child);

    const deleted = await childRepository.deleteById(id);
    if (!deleted) throw new NotFoundError("Child");
    return true;
  }
}

export const childService = new ChildService();

import mongoose from "mongoose";
import {ConflictError,NotFoundError,ValidationError,
} from "../../../shared/errors/app-error";
import { resolveTeacherAssignment } from "../shared";
import { parseDate } from "../../../shared/utils/date.utils";
import { childRepository } from "../repositories/child.repository";
import { calculateBmi, classifyNutritionalStatus } from "../../../shared/utils/nutrition.utils";

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

  async updateChildDocumentIntegrity(id: string, anchorResult: any) {
    const child = await childRepository.findById(id);
    if (!child) throw new NotFoundError("Child");

    child.documentIntegrity = {
      childIdHash: anchorResult.childIdHash,
      documentsHash: anchorResult.documentsHash,
      txHash: anchorResult.txHash,
      blockNumber: anchorResult.blockNumber,
      blockchainVerified: true,
      anchoredAt: new Date(),
    } as never;

    await child.save();
    return child;
  }

  async updateChild(id: string, body: Record<string, any>) {
    const child = await childRepository.findById(id);
    if (!child) throw new NotFoundError("Child");

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
    if (body.weight !== undefined || body.height !== undefined) {
      if (child.weight && child.height) {
        child.bmi = calculateBmi(child.weight, child.height);
        child.nutritionalStatus = classifyNutritionalStatus(child.bmi, child.age) as never;
      }
    }
    if (body.schoolYear !== undefined) child.schoolYear = body.schoolYear;
    if (body.status !== undefined) child.status = body.status;

    if (body.unlinkParent === true) {
      child.parent = undefined;
    }

    if (body.unlinkTeacher === true) {
      child.teacher = undefined;
      child.daycareCenter = undefined;
    } else if (body.teacherId !== undefined) {
      try {
        const teacherAssignment = await resolveTeacherAssignment(
          body.teacherId,
        );
        child.teacher = teacherAssignment?.teacherId || undefined;
        child.daycareCenter = teacherAssignment?.daycareCenterId || undefined;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "invalid_teacher_id")
          throw new ValidationError("Invalid teacher ID");
        if (error instanceof Error && error.message === "teacher_not_found")
          throw new NotFoundError("Teacher");
        throw error;
      }
    }

    await child.save();
    return await childRepository.findByIdWithDetails(child._id.toString());
  }

  async deleteChild(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid child ID");
    const deleted = await childRepository.deleteById(id);
    if (!deleted) throw new NotFoundError("Child");
    return true;
  }
}

export const childService = new ChildService();

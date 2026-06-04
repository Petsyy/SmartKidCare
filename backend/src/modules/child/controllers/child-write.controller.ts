import mongoose from "mongoose";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { createChildForAdmin } from "../services";
import { resolveTeacherAssignment, withDerivedDaycareCenter } from "../shared";
import { childRepository } from "../child.repository";

export const createChild = asyncHandler(async (req: Request, res: Response) => {
  const result = await createChildForAdmin({
    user: req.user,
    body: req.body ?? {},
    files: req.files as
      | {
        [fieldname: string]: Express.Multer.File[];
      }
      | undefined,
  });

  res.status(201).json(result);
});

export const updateChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "admin") {
    throw new ForbiddenError("Admins only");
  }

  const child = await childRepository.findById(String(req.params.id));
  
  if (!child) {
    throw new NotFoundError("Child");
  }

  const {
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    age,
    gender,
    schoolYear,
    status,
    unlinkParent,
    teacherId,
    unlinkTeacher,
  } = req.body ?? {};

  if (firstName !== undefined) child.firstName = firstName;
  if (middleName !== undefined) child.middleName = middleName;
  if (lastName !== undefined) child.lastName = lastName;
  if (dateOfBirth !== undefined) child.dateOfBirth = dateOfBirth;
  if (age !== undefined) child.age = Number(age);
  if (gender !== undefined) child.gender = gender;
  if (schoolYear !== undefined) child.schoolYear = schoolYear;
  if (status !== undefined) child.status = status;

  if (unlinkParent === true) {
    child.parent = undefined;
  }

  if (unlinkTeacher === true) {
    child.teacher = undefined;
    child.daycareCenter = undefined;
  } else if (teacherId !== undefined) {
    try {
      const teacherAssignment = await resolveTeacherAssignment(teacherId);
      child.teacher = teacherAssignment?.teacherId || undefined;
      child.daycareCenter = teacherAssignment?.daycareCenterId || undefined;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "invalid_teacher_id") {
        throw new ValidationError("Invalid teacher ID");
      }

      if (error instanceof Error && error.message === "teacher_not_found") {
        throw new NotFoundError("Teacher");
      }

      throw error;
    }
  }

  await child.save();

  const updated = await childRepository.findByIdWithDetails(child._id.toString());

  res.json(withDerivedDaycareCenter(updated));
});

export const deleteChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "admin") {
    throw new ForbiddenError("Admins only");
  }

  const id = String(req.params.id || "").trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid child ID");
  }

  const deleted = await childRepository.deleteById(id);
  if (!deleted) {
    throw new NotFoundError("Child");
  }

  res.json({ message: "Child deleted successfully" });
});

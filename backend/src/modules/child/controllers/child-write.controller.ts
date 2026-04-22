import mongoose from "mongoose";
import type { Request, Response } from "express";
import Child from "../../../models/Child";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/AppError";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { createChildForAdmin } from "../services";
import { resolveTeacherAssignment, teacherWithCenterPopulate, withDerivedDaycareCenter } from "../shared";

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

  const child = await Child.findById(req.params.id);
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

  const updated = await Child.findById(child._id)
    .populate("parent", "firstName lastName email phone")
    .populate(teacherWithCenterPopulate as never)
    .populate("daycareCenter", "name barangay code isActive")
    .lean();

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

  const deleted = await Child.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Child");
  }

  res.json({ message: "Child deleted successfully" });
});

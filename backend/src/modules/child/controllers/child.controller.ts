import mongoose from "mongoose";
import type { Request, Response } from "express";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/app-error";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { ensureCanAccessChild, withDerivedDaycareCenter } from "../shared";
import { childRepository } from "../repositories/child.repository";
import { childService } from "../services/child.service";
import { childOnboardingService } from "../services/child-onboarding.service";
import { parentService } from "../../parents/services/parents.service";
import type { UploadedFiles } from "../types/child-onboarding.types";
import { buildChildAccessFilter } from "../../../shared/services/child-access.service";

const toCaptainChildView = (child: any) => ({
  _id: child._id,
  studentId: child.studentId,
  firstName: child.firstName,
  middleName: child.middleName,
  lastName: child.lastName,
  birthDate: child.birthDate,
  age: child.age,
  gender: child.gender,
  schoolYear: child.schoolYear,
  status: child.status,
  teacher: child.teacher
    ? { _id: child.teacher._id, firstName: child.teacher.firstName, middleName: child.teacher.middleName, lastName: child.teacher.lastName }
    : null,
  daycareCenter: child.daycareCenter,
  createdAt: child.createdAt,
  updatedAt: child.updatedAt,
});

export const getChildren = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError();

  const query = buildChildAccessFilter(req.user);

  if (req.user.role === "teacher" && req.query.teacherId) {
    query.teacher = req.user.id;
  }
  if (req.query.status) query.status = String(req.query.status);

  const children = await childRepository.findChildrenWithDetails(query);
  const normalized = children.map((child) => withDerivedDaycareCenter(child));
  res.json(req.user.role === "barangay_captain" ? normalized.map(toCaptainChildView) : normalized);
});

export const getMyChildren = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) throw new UnauthorizedError();
    if (req.user.role !== "parent") throw new ForbiddenError("Parents only");

    const children = await childRepository.findChildrenForParent(req.user.id);
    res.json(children.map((child) => withDerivedDaycareCenter(child)));
  },
);

export const getChildById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) throw new UnauthorizedError();
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid child ID");

    const child = await childRepository.findByIdWithDetails(id);
    if (!child) throw new NotFoundError("Child");

    const normalizedChild = withDerivedDaycareCenter(child);
    if (!ensureCanAccessChild(normalizedChild, req)) throw new ForbiddenError();

    res.json(req.user.role === "barangay_captain" ? toCaptainChildView(normalizedChild) : normalizedChild);
  },
);

export const getParentCredentials = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) throw new UnauthorizedError();
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid child ID");

    const child = await childRepository.findByIdWithParentCredentials(id);
    if (!child) throw new NotFoundError("Child");

    if (!ensureCanAccessChild(withDerivedDaycareCenter(child), req)) {
      throw new ForbiddenError();
    }

    const parent = child.parent as any;
    if (!parent) {
      throw new NotFoundError("Parent not found for this child");
    }

    res.json({
      email: parent.email,
      tempPassword: parent.mustChangePassword ? parent.latestTempPassword : null,
    });
  },
);

export const resetParentCredentials = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) throw new UnauthorizedError();
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid child ID");

    const child = await childRepository.findByIdWithParentCredentials(id);
    if (!child) throw new NotFoundError("Child");

    if (!ensureCanAccessChild(withDerivedDaycareCenter(child), req)) {
      throw new ForbiddenError();
    }

    const parent = child.parent as any;
    if (!parent) {
      throw new NotFoundError("Parent not found for this child");
    }

    const { tempPassword } = await parentService.resetPassword(parent._id.toString());

    res.json({
      email: parent.email,
      tempPassword,
    });
  },
);

export const createChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "teacher") throw new ForbiddenError("Teachers only");

  const result = await childOnboardingService.registerChild(
    req.body ?? {},
    req.files as UploadedFiles,
  );
  res.status(201).json(result);
});

export const updateChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "teacher") throw new ForbiddenError("Teachers only");

  const updatedChild = await childService.updateChild(
    req.params.id as string,
    req.body ?? {},
    req.user,
  );
  res.json(withDerivedDaycareCenter(updatedChild));
});

export const deleteChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "teacher") throw new ForbiddenError("Teachers only");

  await childService.deleteChild(req.params.id as string, req.user);
  res.json({ message: "Child deleted successfully" });
});

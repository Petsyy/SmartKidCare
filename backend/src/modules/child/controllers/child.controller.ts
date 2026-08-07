import mongoose from "mongoose";
import type { Request, Response } from "express";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/app-error";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { ensureCanAccessChild, withDerivedDaycareCenter } from "../shared";
import { childRepository } from "../repositories/child.repository";
import { childService } from "../services/child.service";
import { childOnboardingService } from "../services/child-onboarding.service";
import type { UploadedFiles } from "../types/child-onboarding.types";

export const getChildren = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError();

  const query: Record<string, unknown> = {};

  if (req.user.role === "teacher") {
    query.teacher = req.user.id;
  } else if (req.user.role === "parent") {
    query.parent = req.user.id;
  } else if (req.user.role !== "admin") {
    throw new ForbiddenError();
  }

  const children = await childRepository.findChildrenWithDetails(query);
  res.json(children.map((child) => withDerivedDaycareCenter(child)));
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

    res.json(normalizedChild);
  },
);

export const createChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "admin") throw new ForbiddenError("Admins only");

  const result = await childOnboardingService.registerChild(
    req.body ?? {},
    req.files as UploadedFiles,
  );
  res.status(201).json(result);
});

export const updateChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "admin") throw new ForbiddenError("Admins only");

  const updatedChild = await childService.updateChild(
    req.params.id as string,
    req.body ?? {},
  );
  res.json(withDerivedDaycareCenter(updatedChild));
});

export const deleteChild = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== "admin") throw new ForbiddenError("Admins only");

  await childService.deleteChild(req.params.id as string);
  res.json({ message: "Child deleted successfully" });
});

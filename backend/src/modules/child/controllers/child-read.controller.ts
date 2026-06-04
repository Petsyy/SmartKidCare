import mongoose from "mongoose";
import type { Request, Response } from "express";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/app-error";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { ensureCanAccessChild, withDerivedDaycareCenter } from "../shared";
import { childRepository } from "../child.repository";

export const getChildren = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedError();
  }

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
    if (!req.user?.id) {
      throw new UnauthorizedError();
    }

    if (req.user.role !== "parent") {
      throw new ForbiddenError("Parents only");
    }

    const children = await childRepository.findChildrenForParent(req.user.id);

    res.json(children.map((child) => withDerivedDaycareCenter(child)));
  },
);

export const getChildById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError();
    }

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid child ID");
    }

    const child = await childRepository.findByIdWithDetails(id);

    if (!child) {
      throw new NotFoundError("Child");
    }

    const normalizedChild = withDerivedDaycareCenter(child);
    if (!ensureCanAccessChild(normalizedChild, req)) {
      throw new ForbiddenError();
    }

    res.json(normalizedChild);
  },
);

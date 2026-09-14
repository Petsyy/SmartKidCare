import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { directEnrollChild } from "../services/direct-enrollment.service";
import { enrollmentCenterRepository } from "../repositories/enrollment.repository";

const toUploadedFiles = (req: Request) =>
  req.files as
  | {
    [fieldname: string]: Express.Multer.File[];
  }
  | undefined;

export const submitChildEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await directEnrollChild({
      user: req.user,
      body: req.body ?? {},
      files: toUploadedFiles(req),
    });

    res.status(201).json(result);
  },
);

export const getCenters = asyncHandler(async (_req: Request, res: Response) => {
  const centers = await enrollmentCenterRepository.findAllActive();
  res.json({ centers });
});

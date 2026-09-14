import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { directEnrollChild } from "../services/direct-enrollment.service";

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

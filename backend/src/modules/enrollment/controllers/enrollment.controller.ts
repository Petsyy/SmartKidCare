import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { directEnrollChild } from "../services/direct-enrollment.service";
import { enrollmentCenterRepository } from "../repositories/enrollment.repository";
import { documentVerificationService } from "../services/document-verification.service";

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

export const verifyDocument = asyncHandler(async (req: Request, res: Response) => {
  const result = await documentVerificationService.verifyEnrollmentDocument(req.user, req.body, req.file);
  res.status(result.status === "queued" ? 202 : 200).json(result);
});

export const getDocumentVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await documentVerificationService.getEnrollmentDocumentVerification(
      req.user,
      String(req.params.verificationId),
    );
    res.status(200).json(result);
  },
);

export const confirmDocument = asyncHandler(async (req: Request, res: Response) => {
  const result = await documentVerificationService.confirmEnrollmentDocument(req.user, String(req.params.verificationId));
  res.status(200).json(result);
});

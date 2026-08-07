import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import {
  getEnrollmentCenters as getEnrollmentCentersService,
  getEnrollmentRequests as getEnrollmentRequestsService,
  getMyEnrollmentRequests as getMyEnrollmentRequestsService,
} from "../services/enrollment-query.service";
import { submitChildEnrollmentRequest as submitChildEnrollmentRequestService } from "../services/enrollment-submit.service";
import {
  deleteEnrollmentRequest as deleteEnrollmentRequestService,
  reviewEnrollmentRequest as reviewEnrollmentRequestService,
} from "../services/enrollment-review.service";
import {
  getEnrollmentRequestParentCredentials as getEnrollmentRequestParentCredentialsService,
  resetEnrollmentRequestParentPassword as resetEnrollmentRequestParentPasswordService,
} from "../services/enrollment-parent-credentials.service";

const toUploadedFiles = (req: Request) =>
  req.files as
  | {
    [fieldname: string]: Express.Multer.File[];
  }
  | undefined;

export const submitChildEnrollmentRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await submitChildEnrollmentRequestService({
      user: req.user,
      body: req.body ?? {},
      files: toUploadedFiles(req),
    });

    res.status(201).json(result);
  },
);

export const getEnrollmentCenters = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getEnrollmentCentersService(req.user);
    res.json(result);
  },
);

export const getEnrollmentRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getEnrollmentRequestsService(req.user, req.query);
    res.json(result);
  },
);

export const getMyEnrollmentRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getMyEnrollmentRequestsService(req.user);
    res.json(result);
  },
);

export const reviewEnrollmentRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await reviewEnrollmentRequestService(
      req.user,
      req.params.id,
      req.body ?? {},
    );
    res.json(result);
  },
);

export const deleteEnrollmentRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await deleteEnrollmentRequestService(req.user, req.params.id);
    res.json(result);
  },
);

export const resetEnrollmentRequestParentPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await resetEnrollmentRequestParentPasswordService(
      req.user,
      req.params.id,
    );
    res.json(result);
  },
);

export const getEnrollmentRequestParentCredentials = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getEnrollmentRequestParentCredentialsService(
      req.user,
      req.params.id,
    );
    res.json(result);
  },
);

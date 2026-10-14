import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import {
  createChildDocumentAccessToken,
  getChildDocumentStreamByToken,
} from "../services/documents.service";

export const issueChildDocumentAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await createChildDocumentAccessToken(
      req.user,
      String(req.params.id),
      String(req.params.documentType),
    );
    res.status(result.status).json(result.body);
  },
);

export const viewDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getChildDocumentStreamByToken(String(req.query.token));
    if (result.status !== 200) {
      res.status(result.status).json(result.body);
      return;
    }
    const payload = result.body as {
      buffer: Buffer;
      contentType: string;
      fileName: string;
    };
    const safeFileName = payload.fileName.replace(/[\r\n"\\]/g, "_");
    res.setHeader("Content-Type", payload.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(payload.buffer);
  },
);
